// Exercise 1 : Promise.all()
// Promise.all() takes an array of promises (or values) and waits for all of them to finish.
// It resolves only when every promise in the array has resolved.
// If even one promise rejects, the whole Promise.all() rejects immediately and the catch block runs.
// In this example, all 3 inputs resolve successfully, so the final result is an array containing
// the resolved values in the same order as the input: [3, 42, "foo"].

const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 3000, 'foo');
});

Promise.all([promise1, promise2, promise3])
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

// Exercise 2 : Analyse Promise.all()
function timesTwoAsync(x) {
  return new Promise((resolve) => resolve(x * 2));
}

const arr = [1, 2, 3];
const promiseArr = arr.map(timesTwoAsync);

Promise.all(promiseArr)
  .then((result) => {
    console.log(result);
  });

// Output of the second exercise:
// [2, 4, 6]
// Explanation:
// - arr.map(timesTwoAsync) creates 3 promises:
//   Promise.resolve(2), Promise.resolve(4), Promise.resolve(6)
// - Promise.all waits for all of them to resolve
// - Once all are finished, it logs the resolved values in the same order as the array
