SEASONBITE – Restaurant Reservation & Ordering System
A restaurant management web app built using Flask (Python) and MySQL, allowing users to reserve tables, browse menus, place food orders, and make payments — all locally hosted and fully functional offline via a local Flask server.

Features:

Customer Features:
Signup / Login authentication
Reserve available tables in real-time
Browse interactive menu and select quantities
Place and review orders
Make payments (Cash, Card, UPI options)
View booking and order history in Profile

Backend / System Features:
Dynamic table status updates (available / reserved / cancelled)
Database procedures and triggers for automation
Bill calculation using MySQL functions
Local REST API using Flask for data exchange

Tech stack
Frontend - HTML,CSS,JAVASCRIPT
Backend - FLASK(PYTHON)
Database - MYSQL

Usage flow:

launch flask server
open the website
login or signup
choose a table, date/time, confirm reservation
select menu items and proceed to payment
view generated receipt and booking history

Database structures
tables: customer, tables, reservation, menu_items, orders, order_items, payment

procedures&fucntions:

MakeReservation()
CancelReservation()
CalculateTotal(orderId)
MakePayment()

Triggers:

After reservation insert → mark table reserved
After cancellation → mark table available
After payment → mark order as paid

Acknowledgements

MySQL Workbench for database management
Flask for backend routing
HTML/CSS/JS for the interactive UI

“Good food and smooth tech — SEASONBITE makes dining smarter!” 
