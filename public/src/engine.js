/**
 * @type {GameObject[]}
 */
var gameObjectArray = new Array();
/**
 * @type {number}
 */
var X = 0;
/**
 * @type {number}
 */
var Y = 0;
/**
 * @type {number}
 */
var dpi = 0;
var physicsWorld;
window.addEventListener('load', function () {
    Ammo().then(function (Ammo) {
        var infoBox = document.getElementById('info');
        var lastDraw = new Date().getTime() * 1000;
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');

        var collisionConfiguration;
        var dispatcher;
        var broadphase;
        var solver;

        var keys = {
            w: false,
            s: false,
            a: false,
            d: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        //Init functions:

        function initializeGraphics() {
            dpi = window.devicePixelRatio;
            X = canvas.offsetWidth * dpi;
            Y = canvas.offsetHeight * dpi;
            canvas.setAttribute('width', X);
            canvas.setAttribute('height', Y);

            window.addEventListener('resize', onWindowResize, false);
            window.addEventListener('keydown', keydown);
            window.addEventListener('keyup', keyup);
            infoBox.addEventListener('click', function () {
                if (document.body.requestFullscreen) {
                    document.body.requestFullscreen();
                }
                else if (document.body.mozRequestFullScreen) {
                    document.body.mozRequestFullScreen();
                }
                else if (document.body.webkitRequestFullscreen) {
                    document.body.webkitRequestFullscreen();
                }
                else if (document.body.msRequestFullscreen) {
                    document.body.msRequestFullscreen();
                }
            });
        }

        function initializePhysics() {
            collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
        }

        function createObjects() {
            gameObjectArray.push(new BallGameObject(10, 20, { x: 100, y: 200 }, 12));
            gameObjectArray.push(new BoxGameObject(5, 10, 40, { x: 500, y: 500 }, 10));
            gameObjectArray.push(new BoxGameObject(5, 20, 60, { x: 50, y: 50 }, 10));
            gameObjectArray.push(new BoxGameObject(50, 20, 80, { x: 50, y: 500 }, 10));
        }

        //Callbacks for events:
        function keyup(evt) {
            if (evt.key in keys) {
                keys[evt.key] = false;
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        }

        function keydown(evt) {
            if (evt.key in keys) {
                keys[evt.key] = true;
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        }

        function onWindowResize() {
            dpi = window.devicePixelRatio;
            var canvas = document.getElementById('canvas');
            X = canvas.offsetWidth * dpi;
            Y = canvas.offsetHeight * dpi;
            canvas.setAttribute('width', X);
            canvas.setAttribute('height', Y);
        }

        //Main loop:
        function mainLoopIteration() {
            iteratePlayerControlAndUi()
            /*if (keys.w) gameObjectArray[0].mainEngine(1);
            if (keys.s) gameObjectArray[0].mainEngine(-1);
            if (keys.a) gameObjectArray[0].rotate(-1);
            if (keys.d) gameObjectArray[0].rotate(1);*/

            var now = new Date().getTime() * 1000;
            physicsWorld.stepSimulation(now - lastDraw, 10);
            lastDraw = now;
            iterateGraphics();
            gameObjectArray.forEach(function (gameObject) {
                gameObject.update();
                gameObject.draw(ctx);
            });
            window.requestAnimationFrame(mainLoopIteration);
        }

        function iterateGraphics() {
            //Clear
            ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            //Draw star
            ctx.beginPath();
            ctx.arc(Math.random() * X, Math.random() * Y, 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = 'white';
            ctx.fill();
        }
        
        function iteratePlayerControlAndUi() {
            if (keys.w) gameObjectArray[0].up()
            if (keys.s) gameObjectArray[0].down();
            if (keys.a) gameObjectArray[0].left();
            if (keys.d) gameObjectArray[0].right();
            if (keys.ArrowLeft) gameObjectArray[0].rotate(-1);
            if (keys.ArrowRight) gameObjectArray[0].rotate(1);

            infoBox.textContent = 'X: ' + Math.round(gameObjectArray[0].getX()).toString() + '\n'
                + 'Y: ' + Math.round(gameObjectArray[0].getY()).toString();
        }

        //Initialization:
        initializeGraphics();
        initializePhysics();
        createObjects();
        mainLoopIteration();
    });


    var LeftDPadManager = nipplejs.create({zone: document.getElementById('left-d-pad-zone')});
    LeftDPadManager.on('added', function (evt, dpad) {
        dpad.on('dir:up', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
        });
        dpad.on('dir:down', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
        });
        dpad.on('dir:left', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
        });
        dpad.on('dir:right', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        });
        dpad.on('end', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
        });
    }).on('removed', function (evt, dpad) {
        dpad.off('dir end');
    });
    var RightDPadManager = nipplejs.create({zone: document.getElementById('right-d-pad-zone')});
    RightDPadManager.on('added', function (evt, dpad) {
        dpad.on('dir:left', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
        });
        dpad.on('dir:right', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
        });
        dpad.on('end', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));

        });
    }).on('removed', function (evt, dpad) {
        dpad.off('dir end');
    });

});
