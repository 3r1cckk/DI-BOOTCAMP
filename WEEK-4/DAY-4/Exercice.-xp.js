// Exercise 1: Comparison
function compareToTen(num) {
  return new Promise((resolve, reject) => {
    if (num <= 10) {
      resolve(`${num} is less than or equal to 10`);
    } else {
      reject(`${num} is greater than 10`);
    }
  });
}

compareToTen(15)
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

compareToTen(8)
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

// Exercise 2: Promises
const successPromise = new Promise((resolve) => {
  setTimeout(() => {
    resolve("success");
  }, 4000);
});

successPromise.then((message) => console.log(message));

// Exercise 3: Resolve & Reject
const resolvedPromise = Promise.resolve(3);
resolvedPromise.then((value) => console.log(value));

const rejectedPromise = Promise.reject("Boo!");
rejectedPromise.catch((error) => console.log(error));

// Exercise 4: Optional quizz
// Follow the tutorial mentioned in the instructions and complete the quizz.
