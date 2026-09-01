// ========== EXERCISE 5: Users ==========

// 1. Retrieve the div and console.log it
const container = document.getElementById("container");
console.log(container);

// 2. Change the name "Pete" to "Richard"
const allLis = document.querySelectorAll("li");
for (let i = 0; i < allLis.length; i++) {
    if (allLis[i].textContent === "Pete") {
        allLis[i].textContent = "Richard";
    }
}

// 3. Delete the second <li> of the second <ul>
const allUls = document.querySelectorAll("ul.list");
const secondUl = allUls[1];
const secondLiOfSecondUl = secondUl.children[1];
secondLiOfSecondUl.remove();

// 4. Change the name of the first <li> of each <ul> to your name
for (let i = 0; i < allUls.length; i++) {
    const firstLi = allUls[i].firstElementChild;
    firstLi.textContent = "YourName";
}

// 5. Add a class called student_list to both of the <ul>'s
for (let i = 0; i < allUls.length; i++) {
    allUls[i].classList.add("student_list");
}

// 6. Add the classes university and attendance to the first <ul>
allUls[0].classList.add("university", "attendance");

// 7. Add a "light blue" background color and some padding to the <div>
container.style.backgroundColor = "lightblue";
container.style.padding = "20px";

// 8. Do not display the <li> that contains the text node "Dan"
const allLisAgain = document.querySelectorAll("li");
for (let i = 0; i < allLisAgain.length; i++) {
    if (allLisAgain[i].textContent === "Dan") {
        allLisAgain[i].style.display = "none";
    }
}

// 9. Add a border to the <li> that contains the text node "Richard"
for (let i = 0; i < allLisAgain.length; i++) {
    if (allLisAgain[i].textContent === "Richard") {
        allLisAgain[i].style.border = "2px solid black";
    }
}

// 10. Change the font size of the whole body
document.body.style.fontSize = "18px";

// Bonus: If the background color of the div is "light blue", alert "Hello x and y"
if (container.style.backgroundColor === "lightblue") {
    const firstUlNames = allUls[0].querySelectorAll("li");
    const names = [];
    firstUlNames.forEach(li => {
        if (li.style.display !== "none") {
            names.push(li.textContent);
        }
    });
    alert("Hello " + names.join(" and "));
}
