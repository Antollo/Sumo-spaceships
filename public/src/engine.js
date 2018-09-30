/**
 * @type {PlayableBallGameObject[]}
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
var start = true;
var physicsWorld;
window.addEventListener('load', function () {
    Ammo().then(function (Ammo) {
        var timerBox = document.getElementById('timer');
        timerBox.addEventListener('click', function () {
            if (document.body.requestFullscreen) {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                } else {
                    document.body.requestFullscreen()
                }
            }
            else if (document.body.mozRequestFullScreen) {
                if (document.mozFullScreenElement) {
                    document.mozCancelFullScreen()
                } else {
                    document.documentElement.mozRequestFullScreen()
                }
            }
            else if (document.body.webkitRequestFullscreen) {
                if (document.webkitFullscreenElement) {
                    document.webkitExitFullscreen()
                } else {
                    document.body.webkitRequestFullscreen()
                }
            }
            else if (document.body.msRequestFullscreen) {
                if (document.msFullscreenElement) {
                    document.msExitFullscreen()
                } else {
                    document.body.msRequestFullscreen()
                }
            }
        });
        var currentTime = 0;
        setInterval(function () {
            currentTime += 1;
            timerBox.textContent = '  ' + ('00' + Math.floor(currentTime / 60).toString()).substr(-2) + 'm\n' +
                ('00' + Math.floor(currentTime % 60).toString()).substr(-2) + 's';
        }, 1000)
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

        var control = {
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false,
            RotationAngle: 0,
            MoveAngle: 0
        };
        var LeftDPadManager;
        var RightDPadManager

        //Init functions:
        function initializeGraphics() {
            dpi = window.devicePixelRatio;
            X = canvas.offsetWidth * dpi;
            Y = canvas.offsetHeight * dpi;
            canvas.setAttribute('width', X);
            canvas.setAttribute('height', Y);
            window.addEventListener('resize', onWindowResize, false);
        }

        function initializePhysics() {
            collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
        }

        function initializeControl() {
            window.addEventListener('keydown', keydown);
            window.addEventListener('keyup', keyup);
            RightDPadManager = nipplejs.create({ zone: document.getElementById('right-d-pad-zone') });
            RightDPadManager.on('added', function (evt, pad) {
                pad.on('move', function (evt, data) {
                    control.RotationAngle = data.angle.radian;
                });
                pad.on('end', function (evt) {
                    control.RotationAngle = 0;

                });
            }).on('removed', function (evt, pad) {
                pad.off('move end');
            });
            LeftDPadManager = nipplejs.create({ zone: document.getElementById('left-d-pad-zone') });
            LeftDPadManager.on('added', function (evt, pad) {
                pad.on('move', function (evt, data) {
                    control.MoveAngle = -data.angle.radian;
                });
                pad.on('end', function (evt) {
                    control.MoveAngle = 0;

                });
            }).on('removed', function (evt, pad) {
                pad.off('move end');
            });

        }

        function botBuilder() {
            new BotPlayableBallGameObject(10, 30, { x: Math.random() * X, y: Math.random() * Y }, 12);
            setTimeout(botBuilder, 1000000 / Math.sqrt(10000 + currentTime * 1000));
        }

        //Callbacks for events:
        function keyup(evt) {
            if (evt.code in control) {
                control[evt.code] = false;
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        }

        function keydown(evt) {
            if (evt.code in control) {
                control[evt.code] = true;
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
            if (start) {
                start = false;
                currentTime = 0;
                new HumanPlayableBallGameObject(12, 30, { x: Math.random() * X, y: Math.random() * Y }, 16);
            }
            iteratePlayerControl()

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
        }

        function iteratePlayerControl() {
            if (control.KeyW) gameObjectArray[0].mainEngine(1.5 * Math.PI);
            if (control.KeyS) gameObjectArray[0].mainEngine(0.5 * Math.PI);
            if (control.KeyA) gameObjectArray[0].mainEngine(Math.PI);
            if (control.KeyD) gameObjectArray[0].mainEngine(0);
            if (control.ArrowLeft) gameObjectArray[0].rotate(-1);
            if (control.ArrowRight) gameObjectArray[0].rotate(1);
            if (control.Space) gameObjectArray[0].shoot();
            if (control.RotationAngle) gameObjectArray[0].rotateToAngle(control.RotationAngle);
            if (control.MoveAngle) gameObjectArray[0].mainEngine(control.MoveAngle);
        }

        //Initialization:
        initializeGraphics();
        initializePhysics();
        initializeControl();
        botBuilder();
        mainLoopIteration();
    });
});
