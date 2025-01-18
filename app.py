from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import random
import time
from threading import Thread

# 创建 Flask 应用
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


# 首页路由
@app.route('/')
def index():
    return render_template('demo.html')

# WebSocket 事件：客户端连接
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('server_response', {'data': 'Connected to server!'})

# WebSocket 事件：客户端断开连接
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

btn=1
# WebSocket 事件：接收客户端消息
@socketio.on('btnn')
def handle_message(message):
    print('Received message:', message)
    with open('input.txt', 'w') as f:
        f.write(message)
        f.close()
# 模拟数据生成函数
def generate_random_data():
    """后台线程：生成模拟数据并推送到客户端"""
    while True:
        # 生成随机数据
        with open('record.txt', 'r') as file:
            led = file.read();
        file.close()
        time.sleep(0.000001)
        data = {
            'sales': led,  # led
            'orders': btn,  # btn
            'timestamp':  time.strftime('%H:%M:%S')  # 当前时间
        }
        # 推送数据到客户端
        socketio.emit('update_data', data)
        time.sleep(0.000001)
          # 每 2 秒生成一次数据
# 主函数：启动应用
if __name__ == '__main__':
    # 启动后台线程
    Thread(target=generate_random_data, daemon=True).start()
    # 启动 Flask-SocketIO 服务
    socketio.run(app, debug=True, host='0.0.0.0', port=8080)
