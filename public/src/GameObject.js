
function getZRotation(quat) {
    vec = frontVector.rotate(quat.getAxis(), quat.getAngle());
    return Math.atan2(vec.y(), vec.x());
}
function copyVector3(vec) {
    var ret = new Ammo.btVector3(vec.x(), vec.y(), vec.z());
    return ret;
}
function multiplyVector3(vec, scalar) {
    vec.setX(vec.x() * scalar);
    vec.setY(vec.y() * scalar);
    vec.setZ(vec.z() * scalar);
    return vec;
}
var frontVector;

class GameObject {
    constructor(mass, shape, pos, mainEngineForce, manoeuverEngineForce) {
        if (frontVector === undefined) frontVector = new Ammo.btVector3(1, 0, 0);
        this.transform = new Ammo.btTransform();
        this.mainEngineForce = mainEngineForce;
        this.manoeuverEngineForce = manoeuverEngineForce;
        this.color = '#8BC34A';

        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, 0));
        var quat = new Ammo.btQuaternion(1, 0, 0, 0);
        transform.setRotation(quat);

        var motionState = new Ammo.btDefaultMotionState(transform);

        var localInertia = new Ammo.btVector3(0, 0, 0);

        shape.setMargin(0.1);
        shape.calculateLocalInertia(mass, localInertia);

        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

        this.body = new Ammo.btRigidBody(rbInfo);
        this.body.setActivationState(4);
        this.body.setFriction(1);

        physicsWorld.addRigidBody(this.body);
    }
    fixThirdDimension(ms) {
        var velocity = this.body.getAngularVelocity();
        velocity.setX(0);
        velocity.setY(0);
        this.body.setAngularVelocity(velocity);
        velocity = this.body.getLinearVelocity();
        velocity.setZ(0);
        this.body.setLinearVelocity(velocity);

        var origin = this.transform.getOrigin();
        origin.setZ(0);
        this.transform.setOrigin(origin);
        ms.setWorldTransform(this.transform);
        this.body.setMotionState(ms);
    }
    mainEngine(dir) {
        var force = frontVector.rotate(this.transform.getRotation().getAxis(), this.transform.getRotation().getAngle());
        this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce * dir));
    }
    up() { var force = new Ammo.btVector3(0, -1, 0); this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce)); }
    down() { var force = new Ammo.btVector3(0, 1, 0); this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce)); }
    left() { var force = new Ammo.btVector3(-1, 0, 0); this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce)); }
    right() { var force = new Ammo.btVector3(1, 0, 0); this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce)); }

    rotate(dir) {
        this.body.applyTorque(new Ammo.btVector3(0, 0, this.manoeuverEngineForce * dir));
    }
    update() {
        var ms = this.body.getMotionState();
        if (ms) {
            ms.getWorldTransform(this.transform);
            this.fixThirdDimension(ms);
        }
        var x = this.transform.getOrigin().x();
        var y = this.transform.getOrigin().y();
        if (x < 0 || x > X || y < 0 || y > Y) this.remove();
    }
    remove() {
        physicsWorld.removeRigidBody(this.body);
        gameObjectArray.splice(gameObjectArray.indexOf(this), 1);
    }
    getX() {
        return this.transform.getOrigin().x();
    }
    getY() {
        return this.transform.getOrigin().y();
    }
    getAngle() {
        return getZRotation(this.transform.getRotation());
    }


}
class BallGameObject extends GameObject {
    constructor(mass, radius, pos, engineForce) {
        super(mass, new Ammo.btSphereShape(radius), pos, engineForce, 15 * engineForce);
        this.radius = radius;
        this.reloaded = true;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.save();
        var p = this.transform.getOrigin();
        var q = this.transform.getRotation();
        ctx.translate(p.x(), p.y());
        ctx.rotate(getZRotation(q));

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }
}
class PlayableBallGameObject extends BallGameObject {
    constructor(mass, radius, pos, engineForce) {
        super(mass, radius, pos, engineForce);
        this.manualManeuverEngineControl = false;
        this.lastShoot = new Date().getTime();
        this.reloadTime = 500;
    }
    rotate(dir) {
        this.manualManeuverEngineControl = true;
        GameObject.prototype.rotate.call(this, dir)
    }
    update() {
        GameObject.prototype.update.call(this)
        if (!this.manualManeuverEngineControl) {
            if (Math.abs(this.body.getAngularVelocity().z()) >= 0.01) {
                this.body.applyTorque(new Ammo.btVector3(0, 0, -this.manoeuverEngineForce * Math.sign(this.body.getAngularVelocity().z())));
            }
        }
        this.manualManeuverEngineControl = false;
    }
    shoot() {
        if (new Date().getTime() - this.lastShoot > this.reloadTime) {
            var bullet = new BallGameObject(6, 10,
                {
                    x: this.getX() + (this.radius + 10 + 2) * Math.cos(this.getAngle()),
                    y: this.getY() + (this.radius + 10 + 2) * Math.sin(this.getAngle())
                },
                10);
            var vec = this.body.getLinearVelocity();
            bullet.body.setLinearVelocity(vec);
            var vec = frontVector.rotate(this.transform.getRotation().getAxis(), this.transform.getRotation().getAngle());
            bullet.body.applyCentralImpulse(multiplyVector3(vec, 150));
            bullet.color = this.color;
            gameObjectArray.push(bullet);

            this.lastShoot = new Date().getTime();
        }
    }
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.save();
        var p = this.transform.getOrigin();
        var q = this.transform.getRotation();
        ctx.translate(p.x(), p.y());
        ctx.rotate(getZRotation(q));

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, Math.PI * 0.78, -Math.PI * 0.78);
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, Math.PI * 0.85, -Math.PI * 0.85);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, Math.PI * 0.9, -Math.PI * 0.9);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }
}
class BotPlayableBallGameObject extends PlayableBallGameObject {
    constructor(mass, radius, pos, engineForce) {
        super(mass, radius, pos, engineForce);
        this.lastAngle = Math.PI;
        this.color = '#FF5722';
    }
    targetAngle(player) {
        var ab = { x: -Math.cos(this.getAngle()), y: -Math.sin(this.getAngle()) };
        var cb = { x: this.getX() - player.getX(), y: this.getY() - player.getY() };

        var dot = (ab.x * cb.x + ab.y * cb.y); // dot product
        var cross = (ab.x * cb.y - ab.y * cb.x); // cross product

        var alpha = Math.atan2(cross, dot);
        return alpha;
    }
    update() {
        PlayableBallGameObject.prototype.update.call(this)
        var newAngle = this.targetAngle(gameObjectArray[0]);
        if (Math.abs(newAngle) - Math.abs(this.lastAngle) > -0.03) {
            this.rotate(Math.sign(newAngle * 100000000));
        }
        if (Math.abs(newAngle) < 0.5) {
            this.mainEngine(1);
            this.shoot();
        }
        this.lastAngle = newAngle;
    }
}
class BoxGameObject extends GameObject {
    constructor(mass, width, height, pos, engineForce) {
        super(mass, new Ammo.btBoxShape(new Ammo.btVector3(width, height, 100)), pos, engineForce, 40 * engineForce);
        this.width = width;
        this.height = height;

    }
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.save();
        var ms = this.body.getMotionState();
        var p = this.transform.getOrigin();
        var q = this.transform.getRotation();
        ctx.translate(p.x(), p.y());
        ctx.rotate(getZRotation(q));
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width, -this.height, 2 * this.width, 2 * this.height);
        ctx.restore();
    };
};