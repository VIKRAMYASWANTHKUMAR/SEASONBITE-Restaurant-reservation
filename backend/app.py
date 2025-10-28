from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import init_db
import datetime

app = Flask(__name__)
CORS(app)
mysql = init_db(app)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data['name']
    phone = data['phone']
    password = data['password']
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO CUSTOMER (NAME, PHONE_NUMBER, PASSWORD) VALUES (%s, %s, %s)", (name, phone, password))
    mysql.connection.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    phone = data['phone']
    password = data['password']
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM CUSTOMER WHERE PHONE_NUMBER = %s AND PASSWORD = %s", (phone, password))
    user = cur.fetchone()
    if user:
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/tables/available', methods=['GET'])
def available_tables():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM TABLES WHERE STATUS='available'")
    tables = cur.fetchall()
    return jsonify(tables)

@app.route('/menu', methods=['GET'])
def menu():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM MENU_ITEMS")
    menu = cur.fetchall()
    return jsonify(menu)

@app.route('/reserve', methods=['POST'])
def reserve():
    data = request.json
    cur = mysql.connection.cursor()
    # Create reservation
    cur.execute("INSERT INTO RESERVATION (TABLE_ID, CUSTOMER_ID, DATE_TIME) VALUES (%s, %s, %s)",
                (data['table_id'], data['customer_id'], data['date_time']))
    # Update table status
    cur.execute("UPDATE TABLES SET STATUS='reserved' WHERE TABLE_ID=%s", (data['table_id'],))
    mysql.connection.commit()
    return jsonify({'message': 'Table reserved!'})

@app.route('/order', methods=['POST'])
def order():
    data = request.json
    cur = mysql.connection.cursor()
    now = datetime.datetime.now()
    # Create order
    cur.execute("INSERT INTO ORDERS (CUSTOMER_ID, TABLE_ID, ORDER_DATE, STATUS) VALUES (%s, %s, %s, %s)",
                (data['customer_id'], data['table_id'], now, 'ordered'))
    mysql.connection.commit()
    order_id = cur.lastrowid
    # Add items
    for item in data['items']:
        cur.execute("INSERT INTO ORDER_DETAILS (ORDER_ID, MENU_ITEM_ID, QUANTITY) VALUES (%s, %s, %s)",
                    (order_id, item['menu_item_id'], item['quantity']))
    mysql.connection.commit()
    return jsonify({'order_id': order_id})

@app.route('/payment', methods=['POST'])
def payment():
    data = request.json
    cur = mysql.connection.cursor()
    now = datetime.datetime.now()
    cur.execute("INSERT INTO PAYMENT (ORDER_ID, PAYMENT_DATE, AMOUNT, PAYMENT_METHOD, TRANSACTION_ID, PAYMENT_STATUS) VALUES (%s, %s, %s, %s, %s, %s)",
                (data['order_id'], now, data['amount'], data['method'], 'TRX' + str(now.timestamp()), 'completed'))
    mysql.connection.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
