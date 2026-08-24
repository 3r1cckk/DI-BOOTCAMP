class Phone:
    def __init__(self, phone_number):
        self.phone_number = phone_number
        self.call_history = []
        self.messages = []

    def call(self, other_phone):
        if not isinstance(other_phone, Phone):
            print("You must pass another Phone object.")
            return

        message = f"{self.phone_number} called {other_phone.phone_number}"
        self.call_history.append(message)
        print(message)

    def show_call_history(self):
        print(self.call_history)

    def send_message(self, other_phone, content):
        if not isinstance(other_phone, Phone):
            print("You must pass another Phone object.")
            return

        message = {
            "to": other_phone.phone_number,
            "from": self.phone_number,
            "content": content,
        }
        self.messages.append(message)
        other_phone.messages.append(message)
        print(f"Message sent from {self.phone_number} to {other_phone.phone_number}: {content}")

    def show_outgoing_messages(self):
        outgoing = [msg for msg in self.messages if msg["from"] == self.phone_number]
        print(outgoing)

    def show_incoming_messages(self):
        incoming = [msg for msg in self.messages if msg["to"] == self.phone_number]
        print(incoming)

    def show_messages_from(self, sender_phone):
        if not isinstance(sender_phone, Phone):
            print("You must pass another Phone object.")
            return

        messages_from_sender = [
            msg for msg in self.messages if msg["from"] == sender_phone.phone_number
        ]
        print(messages_from_sender)


# Test the code
iphone = Phone("+123")
android = Phone("+456")

iphone.call(android)
android.call(iphone)
iphone.show_call_history()

iphone.send_message(android, "Hello there!")
android.send_message(iphone, "Hi!")

iphone.show_outgoing_messages()
iphone.show_incoming_messages()
iphone.show_messages_from(android)
