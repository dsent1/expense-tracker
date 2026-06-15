/*
Expanse tracker - script.js

Outline:
* Expenses are stored as  an array of objects
* Variables hold states (post sort, pre filter, etc)
* any updated states are saved in localStorage which then calls render()

*/



// Expense instance  = Object formatted like so: { id, description, amount, category, date }
let expenses = [];

let activeFilter = "All";   // which category to show
let sortKey = "date";       // "date" or "amount"
let sortDir = "desc";       // "asc" or "desc"


// Page elements

const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const formError = document.getElementById("form-error");

const totalAmount = document.getElementById("total-amount");
const expenseCount = document.getElementById("expense-count");
const categoryTotals = document.getElementById("category-totals");

const filterSelect = document.getElementById("filter-category");
const sortKeySelect = document.getElementById("sort-key");
const sortDirSelect = document.getElementById("sort-dir");

const expenseList = document.getElementById("expense-list");
const emptyState = document.getElementById("empty-state");

const convertBtn = document.getElementById("convert-btn");
const convertTarget = document.getElementById("convert-target");
const conversionResult = document.getElementById("conversion-result");

// Conversion normalizers
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const eur = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });


//Helper functs

// Today's date as "YYYY-MM-DD" format.
function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// A unique id for each expense using crypto function.
function makeId() {
  return crypto.randomUUID();
}

// Add up the amounts in a list.
function getTotal(list) {
  return list.reduce(function (sum, expense) {
    return sum + expense.amount;
  }, 0);
}


//Saves and loads into lclstorage

function saveExpenses() {
  // localStorage only stores text, so we normalize array -> JSON string w/ stringify.
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function loadExpenses() {
  const saved = localStorage.getItem("expenses");
  if (!saved) {
    expenses = [];
    return;
  }
  try {
    expenses = JSON.parse(saved);
  } catch (error) {
    expenses = [];   // saved data was broken, so just start empty
  }
}



//Decision

function getVisibleExpenses() {
  // Keep only the chosen category (or everything if "All").
  let result = expenses.filter(function (expense) {
    return activeFilter === "All" || expense.category === activeFilter;
  });

  // 2. Sort by date or by amount
  result.sort(function (a, b) {
    let comparison;
    if (sortKey === "amount") {
      comparison = a.amount - b.amount;
    } else {
      comparison = new Date(a.date) - new Date(b.date);
    }
    // Asc. order
    return sortDir === "asc" ? comparison : -comparison;
  });

  return result;
}


//render
function render() {
  const visible = getVisibleExpenses();

  // Build one table row per expense. map() turns each expense into HTML text.
  expenseList.innerHTML = visible.map(function (expense) {
    return "<tr>" +
      "<td>" + expense.description + "</td>" +
      "<td>" + usd.format(expense.amount) + "</td>" +
      "<td>" + expense.category + "</td>" +
      "<td>" + expense.date + "</td>" +
      "<td><button class=\"delete\" data-id=\"" + expense.id + "\">Delete</button></td>" +
      "</tr>";
  }).join("");

  emptyState.hidden = visible.length > 0;

  //Total amt
  totalAmount.textContent = usd.format(getTotal(visible));

  //Count
  expenseCount.textContent =
    visible.length === 1 ? "1 expense shown" : visible.length + " expenses shown";

  
  const byCategory = visible.reduce(function (totals, expense) {
    
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});

  //Object -> List
  categoryTotals.innerHTML = Object.keys(byCategory).map(function (category) {
    return "<li>" + category + ": <span class=\"chip__amount\">" +
      usd.format(byCategory[category]) + "</span></li>";
  }).join("");

  
  conversionResult.textContent = "";

  //Give each new delete button a click handler
  const deleteButtons = document.querySelectorAll(".delete");
  deleteButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      deleteExpense(button.dataset.id);
    });
  });
}




function addExpense() {
  const description = descriptionInput.value;
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  // Error handler for input errors
  if (description.trim() === "") {
    showError("Please enter a description.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showError("Amount must be greater than 0.");
    return;
  }
  if (date === "") {
    showError("Please pick a date.");
    return;
  }

  formError.textContent = "";
  formError.classList.remove("is-visible");

  //Push new expenses to array
  expenses.push({
    id: makeId(),
    description: description.trim(),
    amount: amount,
    category: category,
    date: date
  });

  saveExpenses();
  render();

  //Cleans form
  form.reset();
  dateInput.value = today();
}

function showError(message) {
  formError.textContent = message;
  formError.classList.add("is-visible");
}

function deleteExpense(id) {
  expenses = expenses.filter(function (expense) {
    return expense.id !== id;
  });
  saveExpenses();
  render();
}


//FETCH + ASYNC WAIT: Grabs from API, respecting their wait policy then fetches data

async function convert() {
  const total = getTotal(getVisibleExpenses());
  const target = convertTarget.value;   // "USD" or "EUR"

  // Amounts are stored in USD, so converting to USD needs no exchange rate.
  if (target === "USD") {
    conversionResult.textContent = "= " + usd.format(total);
    return;
  }

  //Neat indicator for if running =true
  convertBtn.disabled = true;
  convertBtn.textContent = "Converting...";
  conversionResult.textContent = "";

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      throw new Error("Failed to fetc.");
    }
    const data = await response.json();
    const rate = data.rates.EUR;
    conversionResult.textContent = "= " + eur.format(total * rate);
  } catch (error) {
    conversionResult.textContent = "Could not get the exchange rate. Try again.";
  }

  convertBtn.disabled = false;
  convertBtn.textContent = "Convert";
}




form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the page from reloading
  addExpense();
});

filterSelect.addEventListener("change", function () {
  activeFilter = filterSelect.value;
  render();
});

sortKeySelect.addEventListener("change", function () {
  sortKey = sortKeySelect.value;
  render();
});

sortDirSelect.addEventListener("change", function () {
  sortDir = sortDirSelect.value;
  render();
});

convertBtn.addEventListener("click", convert);


//Start the app.

dateInput.value = today();
loadExpenses();
render();