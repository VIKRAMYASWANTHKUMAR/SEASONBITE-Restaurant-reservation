let userId = null, tableId = null, orderId = null;
let order = [];
let loggedIn = false;

// Show signup form
function showSignup() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";
}

// Show login form
function showLogin() {
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

// Open auth/login box
function openAuthBox() {
  document.getElementById("authContainer").style.display = "flex";
  if (loggedIn) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("signupBox").style.display = "none";
    if (!document.getElementById("userDetailsBox")) {
      let detailsBox = document.createElement('div');
      detailsBox.id = "userDetailsBox";
      detailsBox.className = "auth-box";
      detailsBox.innerHTML = `<h2>User Details</h2>
        <p>Welcome, User ${userId || ""}!</p>
        <button onclick="closeAuthBox()">Close</button>`;
      document.getElementById("authContainer").appendChild(detailsBox);
    } else {
      document.getElementById("userDetailsBox").style.display = "block";
    }
  } else {
    showLogin();
    if (document.getElementById("userDetailsBox")) {
      document.getElementById("userDetailsBox").style.display = "none";
    }
  }
}

function closeAuthBox() {
  document.getElementById("authContainer").style.display = "none";
  if (document.getElementById("userDetailsBox")) {
    document.getElementById("userDetailsBox").style.display = "none";
  }
}

// Signup handler
function handleSignup() {
  let name = document.getElementById("signupName").value;
  let phone = document.getElementById("signupPhone").value;
  let password = document.getElementById("signupPassword").value;
  if (!name || !phone || !password) {
    alert("All fields required");
    return;
  }
  fetch("http://localhost:5000/register", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({name, phone, password})
  }).then(r=>r.json()).then(data=>{
      alert(data.message);
      showLogin();
  });
}

// Login handler
function handleLogin() {
  let phone = document.getElementById("loginPhone").value;
  let password = document.getElementById("loginPassword").value;
  fetch("http://localhost:5000/login", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({phone, password})
  }).then(r=>r.json()).then(data=>{
    if(data.success){
      userId = data.user.CUSTOMER_ID;
      loggedIn = true;
      document.getElementById("authContainer").style.display="none";
    } else {
      alert("Invalid login!");
    }
  });
}

// Book table handler (ALWAYS shows 5 tables, demo/fallback)
document.getElementById("bookTableBtn").onclick = function() {
  if (!loggedIn) {
    alert("Please login to book a table.");
    openAuthBox();
    return;
  }
  // Show only reservation overlay, hide all others
  document.getElementById("reservationSection").style.display = "block";
  document.getElementById("menuPopup").style.display = "none";
  document.getElementById("orderSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "none";

  let sel = document.getElementById("resTable");
  sel.innerHTML = '<option value="">Select a Table</option>';
  let dummyTables = [
    {TABLE_ID: 1, CAPACITY: 2},
    {TABLE_ID: 2, CAPACITY: 4},
    {TABLE_ID: 3, CAPACITY: 2},
    {TABLE_ID: 4, CAPACITY: 6},
    {TABLE_ID: 5, CAPACITY: 4}
  ];
  dummyTables.forEach(t => {
    sel.innerHTML += `<option value='${t.TABLE_ID}'>Table ${t.TABLE_ID} - ${t.CAPACITY} seats</option>`;
  });
  // Uncomment to use backend instead of demo:
  /*
  fetch("http://localhost:5000/tables/available").then(r=>r.json())
    .then(tables=> {
      sel.innerHTML = '<option value="">Select a Table</option>';
      tables.forEach(t => {
        sel.innerHTML += `<option value='${t.TABLE_ID}'>Table ${t.TABLE_ID} - ${t.CAPACITY} seats</option>`;
      });
    });
  */
};

// Menu handler: scrollable, compact card with qty controls and price
document.getElementById("menuBtn").onclick = function() {
  document.getElementById("menuPopup").style.display = "block";
  document.getElementById("reservationSection").style.display = "none";
  document.getElementById("orderSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "none";
  fetch("http://localhost:5000/menu").then(r=>r.json())
  .then(items=> {
    let m = document.getElementById("menuItems"); m.innerHTML="";
    items.forEach(d => {
      let existing = order.find(o => o.menu_item_id === d.MENU_ITEM_ID);
      let qty = existing ? existing.quantity : 0;
      m.innerHTML += `
        <div class="menu-item-row">
          <span class="menu-name">${d.DISH_NAME}</span>
          <span class="menu-price">₹${d.PRICE}</span>
          <div class="menu-qty-controls">
            <button class="qty-btn" onclick="changeQty(${d.MENU_ITEM_ID}, -1, ${d.PRICE})">-</button>
            <input type="text" id="qty_${d.MENU_ITEM_ID}" class="qty-input" data-price="${d.PRICE}" value="${qty}" readonly>
            <button class="qty-btn" onclick="changeQty(${d.MENU_ITEM_ID}, 1, ${d.PRICE})">+</button>
          </div>
        </div>
      `;
    });
  });
};

window.changeQty = function(id, delta, price = null) {
  let input = document.getElementById(`qty_${id}`);
  let val = parseInt(input.value, 10);
  let newVal = (isNaN(val) ? 0 : val) + delta;
  if(newVal < 0) newVal = 0;
  input.value = newVal;
  let idx = order.findIndex(o => o.menu_item_id === id);
  if(newVal === 0 && idx !== -1) {
    order.splice(idx, 1);
  } else if(idx !== -1) {
    order[idx].quantity = newVal;
  } else if(newVal > 0) {
    let dishPrice = price || parseFloat(input.getAttribute('data-price')) || 0;
    order.push({ menu_item_id: id, quantity: newVal, price: dishPrice });
  }
  updateOrderSection(); // Update total automatically
};

function closeMenu() {
  document.getElementById("menuPopup").style.display = "none";
}

function proceedToOrder(){
  if (order.length === 0) {
    alert("Please select at least one dish before proceeding.");
    return;
  }
  document.getElementById("orderSection").style.display = "block";
  document.getElementById("menuPopup").style.display = "none";
  document.getElementById("reservationSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "none";
  updateOrderSection();
}

function updateOrderSection() {
  let os = document.getElementById("orderSummary");
  if (!os) return;
  let total = 0;
  os.innerHTML = order.map(one => {
    let line = `${one.quantity} x ${one.menu_item_id} (₹${one.price * one.quantity})`;
    total += one.price * one.quantity;
    return line;
  }).join("<br>");
  os.innerHTML += `<hr><b>Total: ₹${total}</b>`;
  let payInput = document.getElementById("payAmount");
  if(payInput) payInput.value = total > 0 ? total : "";
}

document.getElementById("confirmReservation").onclick = function() {
  const date = document.getElementById("resDate").value;
  const time = document.getElementById("resTime").value;
  tableId = document.getElementById("resTable").value;

  if (!date || !time || !tableId) {
    alert("Please fill all reservation details.");
    return;
  }
  if(!userId) { 
    alert("Login first!"); 
    return; 
  }
  // This is where you'd confirm the reservation with backend.
  alert("Reserved! Now add menu items."); 
  document.getElementById("reservationSection").style.display = "none";
  document.getElementById("menuPopup").style.display = "block";
  document.getElementById("orderSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "none";
};

function payNow(){
  const date = document.getElementById("resDate").value;
  const time = document.getElementById("resTime").value;
  const tableSel = document.getElementById("resTable").value;

  if (!tableId || !date || !time || !tableSel) {
    alert("Please complete table reservation first before proceeding to payment.");
    document.getElementById("reservationSection").style.display = "block";
    document.getElementById("menuPopup").style.display = "none";
    document.getElementById("orderSection").style.display = "none";
    document.getElementById("paymentSection").style.display = "none";
    let sel = document.getElementById("resTable");
    sel.innerHTML = '<option value="">Select a Table</option>';
    let dummyTables = [
      {TABLE_ID: 1, CAPACITY: 2},
      {TABLE_ID: 2, CAPACITY: 4},
      {TABLE_ID: 3, CAPACITY: 2},
      {TABLE_ID: 4, CAPACITY: 6},
      {TABLE_ID: 5, CAPACITY: 4}
    ];
    dummyTables.forEach(t => {
      sel.innerHTML += `<option value='${t.TABLE_ID}'>Table ${t.TABLE_ID} - ${t.CAPACITY} seats</option>`;
    });
    return;
  }
  if (order.length === 0) {
    alert("Please select at least one dish to pay.");
    return;
  }
  document.getElementById("paymentSection").style.display="block";
  document.getElementById("reservationSection").style.display = "none";
  document.getElementById("menuPopup").style.display = "none";
  document.getElementById("orderSection").style.display = "none";
  updateOrderSection();
}

function confirmPay(){
  const amt = document.getElementById("payAmount").value;
  const method = document.getElementById("payMethod").value;
  if (!amt || amt <= 0) {
    alert("Amount must be valid and non-empty.");
    return;
  }
  if (!method) {
    alert("Select a payment method.");
    return;
  }
  // Simulate successful payment
  alert("Payment Successful!");
}

function scrollToAboutUs() {
  document.getElementById("aboutUsSection").scrollIntoView({behavior: "smooth"});
}

// User details dropdown (optional, not part of updated flow)
function toggleUserDetails() {
  const details = document.getElementById("userDetails");
  if(details.style.display==="block") details.style.display="none";
  else { details.style.display="block"; }
}
