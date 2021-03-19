var sw = 20, //一个方块的宽度
    sh = 20, //一个方块的高度
    tr = 30, //行数
    td = 30; //列数
var snake = null, //蛇的实例
    food = null, //食物的实例
    game = null; //游戏的实例

//x, y 表示小方块的坐标(1, 1)   classname 表示方块的类别：蛇头、蛇尾、食物
// 方块构造函数
function Square(x, y, classname) {
    this.x = x * sw; //乘小方块的宽度得到实际值
    this.y = y * sh;
    this.class = classname;

    this.viewContent = document.createElement("div"); //方块对应的DOM元素
    this.viewContent.className = this.class;
    this.parent = document.getElementById("snakeWrap"); //方块的父级
}

// 创建方块DOM 并添加到页面里
Square.prototype.create = function() {
    this.viewContent.style.position = "absolute";
    this.viewContent.style.width = sw + "px";
    this.viewContent.style.height = sh + "px";
    this.viewContent.style.left = this.x + "px";
    this.viewContent.style.top = this.y + "px";
    //添加到父级当中
    this.parent.appendChild(this.viewContent);
}

// 移除方块
Square.prototype.remove = function() {
    this.parent.removeChild(this.viewContent);
}

// 蛇
function Snake() {
    // 存一下蛇头蛇尾的信息
    this.head = null;
    this.tail = null;
    this.pos = []; // 储存蛇身上的每一个方块的位置
    this.directionNum = { //储存蛇走的方向，用一个对象来表示
        left: {
            x: -1,
            y: 0,
            rotate: 180 // 蛇头在不同的方向中应该进行旋转，要不始终向右
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    }
}

// 初始化
Snake.prototype.init = function() {
    // 创建蛇头
    var snakeHead = new Square(2, 0, "snakeHead");
    snakeHead.create();
    this.head = snakeHead; // 存储蛇头信息
    this.pos.push([2, 0]); //把蛇头的位置存起来

    // 创建蛇身1
    var snakeBody1 = new Square(1, 0, "snakeBody");
    snakeBody1.create();
    this.pos.push([1, 0]); //把蛇身1的位置存起来

    // 创建蛇身2
    var snakeBody2 = new Square(0, 0, "snakeBody");
    snakeBody2.create();
    this.tail = snakeBody2; //更新蛇尾
    this.pos.push([0, 0]); //把蛇身2的位置存起来

    // 形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    // 给蛇添加一条属性，用来表示蛇走的方向
    this.direction = this.directionNum.right; //默认让蛇往右走
}

//获取蛇头的下一个位置对应的元素，要根据元素做不同的事情
Snake.prototype.getNextPos = function() {
    var nextPos = [ //蛇头要走的下一个点的坐标
        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ]

    // 下一个点是自己，代表撞到了自己，游戏结束
    var selfCollied = false; // 标志是否撞到了自己
    this.pos.forEach(function(value) {
        //不能够直接将 value 和 nextPos 两个对象直接进行比较，因为对象需要比较两者在内存中的地址，而两个储存的地址是不相同的，所以需要比较对象中具体的数据才行
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            // 如果数组中的两个数据都相等，就说明下一个点在蛇的身上，代表撞到自己了
            selfCollied = true;
        }
    })
    if (selfCollied == true) {
        console.log("撞到自己了");
        this.strategies.die.call(this);
        return;
    }

    // 下一个点是围墙，游戏结束
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        console.log("撞墙了");
        this.strategies.die.call(this);
        return;
    }

    // 下一个点是食物，吃
    if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        // 如果这个条件成立，说明蛇头要走的下一个点 是食物
        console.log("撞到食物了！");
        this.strategies.eat.call(this);
    }


    // 下一个点什么都不是，走
    this.strategies.move.call(this);

}

//处理碰撞后要做的事  strategies:策略
Snake.prototype.strategies = {
    move: function(format) { //这个参数用于决定要不要删除最后一个方块（蛇尾），当传了这个参数后就表示要做的事情是吃
        // 创建一个新身体在就旧蛇头的位置
        var newBody = new Square(this.head.x / sw, this.head.y / sh, "snakeBody");
        // 更新链表关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        this.head.remove(); // 把就蛇头从原来的位置删除
        newBody.create();

        // 创建一个新蛇头(蛇头下一个要走到的点)
        var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, "snakeHead");

        // 更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = "rotate(" + this.direction.rotate + "deg)";
        newHead.create();

        // 蛇身上的每一个方块的坐标也要更新
        this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y]);
        this.head = newHead; // 还要把 this.head 的信息更新一下

        if (!format) { // 如果 format 的值为 false，表示需要删除（除了吃之外的操作）
            this.tail.remove();
            this.tail = this.tail.last;

            // 更新坐标数组
            this.pos.pop(); //删除数组的最后一组坐标
        }
    },
    eat: function() {
        this.strategies.move.call(this, true);
        createFood();
        game.score++;
    },
    die: function() {
        game.over();
    }
}

snake = new Snake();

// 创建食物
function createFood() {
    // 食物小方块的随机坐标
    var x = null;
    var y = null;

    var include = true; // 循环跳出的条件，true 表示食物在蛇的身上（需要继续循环），false 表示食物的坐标不在蛇的身上（不循环了）
    while (include) {
        var flag = 0;
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function(value) {
            if (value[0] == x && value[1] == y) {
                flag = 1
                return; // 坐标在蛇身上，退出循环，直接下一次循环
            }
        })
        if (flag == 0) { //如果flag的值没有发生改变，说明坐标没有在蛇身上
            include = false;
        }
    }

    // 生成食物
    food = new Square(x, y, "food");
    food.pos = [x, y]; //存储生成食物的坐标，用于跟蛇要走的下一个点做对比

    var foodDom = document.querySelector(".food");
    if (foodDom) {
        foodDom.style.left = x * sw + "px";
        foodDom.style.top = y * sh + "px";
    } else {
        food.create();
    }
}

// 创建游戏逻辑
function Game() {
    this.timer = null; //定时器
    this.score = 0;
}

Game.prototype.init = function() {
    snake.init();
    // snake.getNextPos();
    createFood();

    document.onkeydown = function(ev) {
        console.log(ev.key.charCodeAt());
        if (ev.which == 37 && snake.direction != snake.directionNum.right) { //用户按下左键 并且此时这条蛇不是往右走
            snake.direction = snake.directionNum.left;
        } else if (ev.which == 38 && snake.direction != snake.directionNum.down) { //用户按下上键 并且此时这条蛇不是往下走
            snake.direction = snake.directionNum.up;
        } else if (ev.which == 39 && snake.direction != snake.directionNum.left) { //用户按下右键 并且此时这条蛇不是往右走
            snake.direction = snake.directionNum.right;
        } else if (ev.which == 40 && snake.direction != snake.directionNum.up) { //用户按下下键 并且此时这条蛇不是往右走
            snake.direction = snake.directionNum.down;
        }
    }

    this.start();
}

Game.prototype.start = function() { //开始游戏
    this.timer = setInterval(function() {
        snake.getNextPos();
    }, 200);
}

Game.prototype.pause = function() {
    clearInterval(this.timer);
}

Game.prototype.over = function() {
    clearInterval(this.timer);
    alert("你的得分为：" + this.score);

    // 游戏回到最初的状态
    var snakeWrap = document.getElementById("snakeWrap");
    snakeWrap.innerHTML = "";

    snake = new Snake();
    game = new Game();

    var startBtnWrap = document.querySelector(".startBtn");
    startBtnWrap.style.display = "block";
}

// 开启键盘
game = new Game();
var startBtn = document.querySelector(".startBtn button");
startBtn.onclick = function() {
    startBtn.parentNode.style.display = "none";
    game.init();
}

// 暂停
var snakeWrap = document.getElementById("snakeWrap");
var pauseBtn = document.querySelector(".pauseBtn button");
snakeWrap.onclick = function() {
    game.pause();

    pauseBtn.parentNode.style.display = "block";
}

pauseBtn.onclick = function() {
    game.start();
    pauseBtn.parentNode.style.display = "none";
}