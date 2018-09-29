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
        var beginTime = new Date().getTime();
        var lastDraw = new Date().getTime() * 1000;
        var canvas = document.getElementById('canvas');
        /**
         * @type {CanvasRenderingContext2D}
         */
        var ctx = canvas.getContext('2d');

        var collisionConfiguration;
        var dispatcher;
        var broadphase;
        var solver;

        var keys = {
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
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
            gameObjectArray.push(new PlayableBallGameObject(10, 30, { x: 100, y: 200 }, 12));
            botBuilder();
            /*for (let i = 0; i < 12; i++) {
                gameObjectArray.push(new BoxGameObject(Math.random() * 40 + 40, Math.random() * 100, Math.random() * 100,
                { x: Math.random() * X, y: Math.random() * Y }, Math.random() * 10));
            }*/
        }

        function botBuilder() {
            gameObjectArray.push(new BotPlayableBallGameObject(10, 30, { x: Math.random() * X, y: Math.random() * Y }, 12));
            console.log(1000000/Math.sqrt(10000 + new Date().getTime() - beginTime));
            setTimeout(botBuilder, 1000000/Math.sqrt(10000 + new Date().getTime() - beginTime));
        }

        //Callbacks for events:
        function keyup(evt) {
            if (evt.code in keys) {
                keys[evt.code] = false;
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        }

        function keydown(evt) {
            if (evt.code in keys) {
                keys[evt.code] = true;
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, X, Y);

            //Draw star
            /*ctx.beginPath();
            ctx.arc(Math.random() * X, Math.random() * Y, 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = 'white';
            ctx.fill();*/
        }
        
        function iteratePlayerControlAndUi() {
            if (keys.KeyW) gameObjectArray[0].up()
            if (keys.KeyS) gameObjectArray[0].down();
            if (keys.KeyA) gameObjectArray[0].left();
            if (keys.KeyD) gameObjectArray[0].right();
            if (keys.ArrowLeft) gameObjectArray[0].rotate(-1);
            if (keys.ArrowRight) gameObjectArray[0].rotate(1);
            if (keys.Space) gameObjectArray[0].shoot();

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
            console.log(evt);
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
        });
        dpad.on('dir:down', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
        });
        dpad.on('dir:left', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
        });
        dpad.on('dir:right', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
        });
        dpad.on('end', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
        });
    }).on('removed', function (evt, dpad) {
        dpad.off('dir end');
    });
    var RightDPadManager = nipplejs.create({zone: document.getElementById('right-d-pad-zone')});
    RightDPadManager.on('added', function (evt, dpad) {
        dpad.on('dir:left', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
        });
        dpad.on('dir:right', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
        });
        dpad.on('dir:up', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
        });
        dpad.on('dir:down end', function (evt) {
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));

        });
    }).on('removed', function (evt, dpad) {
        dpad.off('dir end');
    });

});
