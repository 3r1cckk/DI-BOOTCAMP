const products = require('./products');

function findProductByName(productName) {
  return products.find(
    (product) => product.name.toLowerCase() === productName.toLowerCase()
  );
}

const productNames = ['Laptop', 'Headphones', 'Notebook', 'Chair'];

productNames.forEach((name) => {
  const product = findProductByName(name);

  if (product) {
    console.log(`Product found: ${product.name}`);
    console.log(product);
  } else {
    console.log(`No product found for: ${name}`);
  }
});
