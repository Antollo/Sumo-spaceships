
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
    constructor(mass, shape, pos) {
        if (frontVector === undefined) frontVector = new Ammo.btVector3(1, 0, 0);
        this.transform = new Ammo.btTransform();
        this.color = 'white';
        this.removed = false;
        this.mass = mass;

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
        gameObjectArray.push(this);
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
        this.removed = true;
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
    constructor(mass, radius, pos) {
        super(mass, new Ammo.btSphereShape(radius), pos);
        this.radius = radius;
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
        super(mass, radius, pos);
        this.mainEngineForce = engineForce;
        this.manoeuverEngineForce = 15 * engineForce;
        this.manualManeuverEngineControl = false;
        this.lastShoot = new Date().getTime();
        this.reloadTime = 500;
    }
    rotate(dir) {
        this.manualManeuverEngineControl = true;
        this.body.applyTorque(new Ammo.btVector3(0, 0, this.manoeuverEngineForce * dir));
    }
    rotateImpulse(dir) {
        this.manualManeuverEngineControl = true;
        this.body.applyTorqueImpulse(new Ammo.btVector3(0, 0, this.manoeuverEngineForce * dir));
    }
    mainEngineForward(dir) {
        var force = frontVector.rotate(this.transform.getRotation().getAxis(), this.transform.getRotation().getAngle());
        this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce * dir));
    }
    mainEngine(angle) {
        var force = new Ammo.btVector3(Math.cos(angle), Math.sin(angle), 0);
        this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce));
    }
    targetAngle(vec2) {
        var ab = { x: -Math.cos(this.getAngle()), y: -Math.sin(this.getAngle()) };
        var cb = vec2;

        var dot = (ab.x * cb.x + ab.y * cb.y); // dot product
        var cross = (ab.x * cb.y - ab.y * cb.x); // cross product

        var alpha = Math.atan2(cross, dot);
        return alpha;
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
            var bullet = new BallGameObject(this.mass / 2, 10,
                {
                    x: this.getX() + (this.radius + 10 + 2) * Math.cos(this.getAngle()),
                    y: this.getY() + (this.radius + 10 + 2) * Math.sin(this.getAngle())
                },
                10);
            var vec = this.body.getLinearVelocity();
            bullet.body.setLinearVelocity(vec);
            var vec = frontVector.rotate(this.transform.getRotation().getAxis(), this.transform.getRotation().getAngle());
            bullet.body.applyCentralImpulse(multiplyVector3(vec, this.mainEngineForce * 10));
            bullet.color = this.color;

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

        /*ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 6, Math.PI * 0.78, -Math.PI * 0.78);
        ctx.stroke();*/
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, Math.PI * 0.85, -Math.PI * 0.85);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 12, Math.PI * 0.9, -Math.PI * 0.9);
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
    update() {
        PlayableBallGameObject.prototype.update.call(this)
        var newAngle = this.targetAngle({x: this.getX() - gameObjectArray[0].getX(), y: this.getY() - gameObjectArray[0].getY()});
        if (Math.abs(newAngle) - Math.abs(this.lastAngle) > -0.03) {
            this.rotateImpulse(Math.sign(newAngle));
        }
        if (Math.abs(newAngle) < 0.5) {
            this.mainEngineForward(1);
            this.shoot();
        }
        this.lastAngle = newAngle;
    }
}
class HumanPlayableBallGameObject extends PlayableBallGameObject {
    constructor(mass, radius, pos, engineForce) {
        super(mass, radius, pos, engineForce);
        this.lastAngle = Math.PI;
        this.color = '#4CAF50';
        gameObjectArray.splice(gameObjectArray.length - 1, 1);
        gameObjectArray.unshift(this);
    }
    rotateToAngle(angle) {
        var newAngle = this.targetAngle({x: -Math.cos(angle) * 10, y: Math.sin(angle) * 10});
        //console.log({x: Math.cos(angle) * 10, y: Math.sin(angle) * 10});
        if (Math.abs(newAngle) - Math.abs(this.lastAngle) > -0.03) {
            this.rotateImpulse(Math.sign(newAngle));
        }
        if (Math.abs(newAngle) < 0.5) {
            //this.mainEngineForward(1);
            this.shoot();
        }
        this.lastAngle = newAngle;
    }
    update() {
        PlayableBallGameObject.prototype.update.call(this);
        if (this.removed) start = true;
    }
}
class BoxGameObject extends GameObject {
    constructor(mass, width, height, pos) {
        super(mass, new Ammo.btBoxShape(new Ammo.btVector3(width, height, 100)), pos);
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