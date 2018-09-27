
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
    fixThirdDimension() {
        var velocity = this.body.getAngularVelocity();
        velocity.setX(0);
        velocity.setY(0);
        this.body.setAngularVelocity(velocity);
        var velocity = this.body.getLinearVelocity();
        velocity.setZ(0);
        this.body.setLinearVelocity(velocity);
    }
    mainEngine(dir) {
        var force = frontVector.rotate(this.transform.getRotation().getAxis(), this.transform.getRotation().getAngle());
        this.body.applyCentralForce(multiplyVector3(force, this.mainEngineForce * dir));
    }
    rotate(dir) {
        this.body.applyTorque(new Ammo.btVector3(0, 0, this.manoeuverEngineForce * dir));
    }
    update() {
        var ms = this.body.getMotionState();
        if (ms) ms.getWorldTransform(this.transform);
        this.fixThirdDimension();
    }
    getX() {
        return this.transform.getOrigin().x();
    }
    getY() {
        return this.transform.getOrigin().y();
    }


}
class BallGameObject extends GameObject {
    constructor(mass, radius, pos, engineForce) {
        super(mass, new Ammo.btSphereShape(radius), pos, engineForce, 15 * engineForce);
        this.radius = radius;
        this.manualManeuverEngineControl = false;
        this.mainSprite = new Image();
        this.mainSprite.src = 'ball-spaceship.png';
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
        ctx.fillStyle = 'red';
        ctx.fill();

        ctx.strokeStyle = "black"
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, Math.PI * 0.78, -Math.PI * 0.78);
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = "red"
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, Math.PI * 0.85, -Math.PI * 0.85);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, Math.PI * 0.9, -Math.PI * 0.9);
        ctx.stroke();
        ctx.closePath();

        //ctx.drawImage(this.mainSprite, -this.radius, -this.radius);
        ctx.restore();
        this.manualManeuverEngineControl = false;
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
        ctx.fillStyle = 'red';
        ctx.fillRect(-this.width, -this.height, 2 * this.width, 2 * this.height);
        ctx.restore();
    };
};