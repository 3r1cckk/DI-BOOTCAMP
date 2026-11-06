import { createServer } from "node:net";

export async function startSmtpCapture() {
  const messages = [];
  const server = createServer((socket) => {
    let buffer = "";
    let message = "";
    let recipients = [];
    let receivingMessage = false;
    socket.write("220 localhost ESMTP\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newline;
      while ((newline = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 2);
        if (receivingMessage) {
          if (line === ".") {
            receivingMessage = false;
            messages.push({ recipients, content: message });
            message = "";
            recipients = [];
            socket.write("250 Message accepted\r\n");
          } else {
            message += `${line.startsWith("..") ? line.slice(1) : line}\r\n`;
          }
          continue;
        }

        const [command] = line.split(/\s+/, 1);
        if (command === "EHLO" || command === "HELO") {
          socket.write("250-localhost\r\n250 SIZE 10000000\r\n");
        } else if (command === "MAIL") {
          socket.write("250 Sender accepted\r\n");
        } else if (command === "RCPT") {
          recipients.push(line.match(/<([^>]+)>/)?.[1] || "");
          socket.write("250 Recipient accepted\r\n");
        } else if (command === "DATA") {
          receivingMessage = true;
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (command === "QUIT") {
          socket.end("221 Bye\r\n");
        } else if (command === "RSET" || command === "NOOP") {
          socket.write("250 OK\r\n");
        } else {
          socket.end("500 Unsupported SMTP command\r\n");
        }
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  return {
    port: server.address().port,
    verificationTokenFor(email) {
      const message = [...messages].reverse().find((item) =>
        item.recipients.includes(email)
      );
      const token = message?.content.match(/verify=(?:3D)?([A-Za-z0-9_-]{43})/)?.[1];
      if (!token) throw new Error(`No verification link was sent to ${email}.`);
      return token;
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  };
}
