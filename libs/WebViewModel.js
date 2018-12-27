var renderer, light, mixers = [];
var modelShow = new THREE.Group();
var initPosition = true;
var clock = new THREE.Clock();
var model_url     // 模型路径
var model_center;       // 模型中心
var cameraResetPosition;

function initRender() {                 //渲染方式
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xd7d7d7);
    document.getElementById("container").appendChild(renderer.domElement);

}

function getModelUrl() {
    var storage = window.localStorage;
    model_url = storage["url"];     // 模型路径
}

var fontModel;

function initErrorModel() {

    var font;
    var loader = new THREE.FontLoader();
    loader.load("libs/gentilis_regular.typeface.json", function (res) {
        font = new THREE.TextBufferGeometry("Failed to load", {
            font: res,
            size: 100,
            height: 20
        });

        font.computeBoundingBox(); // 运行以后设置font的boundingBox属性对象，如果不运行无法获得。
        //font.computeVertexNormals();

        var material = new THREE.MeshLambertMaterial({color: '#ff4c4c', side: THREE.DoubleSide});
        fontModel = new THREE.Mesh(font, material);
        fontModel.scale.set(0.1, 0.1, 0.1);

        //设置位置
        fontModel.name = "error_model"
        fontModel.position.x = -(font.boundingBox.max.x * 0.1 - font.boundingBox.min.x * 0.1) / 2; //计算出整个模型的宽度的一半
        scene.add(fontModel);
    });
}

var camera;

function initCamera() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 0, 1);               //摄像机位置
}

var scene;
var grid

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd7d7d7);


}

function initGrid(position_Y) {
    grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.position.y = position_Y;
    grid.material.transparent = true;
    scene.add(grid);
}

document.addEventListener("dblclick", function (ev) {
    initPosition = false;
})

function gradeChange() {            // 获取模型的路径
    var objS = document.getElementById("mySelect");
    var grade = objS.options[objS.selectedIndex].value;
    if (grade == model_url) {
        return;
    }
    model_url = grade;          // 模型路径传入
    console.log(model_url);
    disposeScene();         // 去掉场景内部的其他模型；
    initLoader();       // 开始加载模型；
}

function initLight() {      //灯光渲染
    light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 200, 0);
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 200, 100);
    light.castShadow = true;
    light.shadow.camera.top = 180;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.left = -120;
    light.shadow.camera.right = 120;
    scene.add(light);
}

function disposeScene() {
    console.log(scene);
    scene.remove(scene.children[scene.children.length - 1]);
    console.log(scene);
}

function initLoader() {
    // ========   fbx loader
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    var onError = function () {
        initErrorModel();
    };
    if (model_url.indexOf('.fbx') > 0) {

        var loader = new THREE.FBXLoader();    // 加载fbx 模型
        try {
            loader.load(model_url, function (object) {

                object.mixer = new THREE.AnimationMixer(object);
                mixers.push(object.mixer);

                var action = object.mixer.clipAction(object.animations[0]);
                action.play();

                object.traverse(function (child) {

                    if (child.isMesh) {

                        child.castShadow = true;
                        child.receiveShadow = true;
                    }

                });
                modelShow.add( object);
                var box = new THREE.Box3();
                //通过传入的object3D对象来返回当前模型的最小大小，值可以使一个mesh也可以使group
                box.expandByObject(modelShow);
                model_center = box.getCenter();
                object.position.y = - model_center.y;
                cameraResetPosition = returnPosition_z((box.max.y - box.min.y),box.max.z);
                camera.position.z = returnPosition_z((box.max.y - box.min.y),box.max.z);
                initGrid(- model_center.y);
                scene.add(modelShow);
                initPosition = true;

            }, onProgress, onError);
        } catch (e) {
            initErrorModel();
        }
    } else if (model_url.indexOf('.obj') > 0) {

        THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());
        var loader = new THREE.OBJLoader();
        try {
            loader.load(model_url, function (obj) {

                modelShow.add(obj);
                var box = new THREE.Box3();
                //通过传入的object3D对象来返回当前模型的最小大小，值可以使一个mesh也可以使group
                box.expandByObject(modelShow);
                model_center = box.getCenter();
                obj.position.y = - model_center.y;
                camera.position.z = returnPosition_z((box.max.y - box.min.y),box.max.z);
                cameraResetPosition = returnPosition_z((box.max.y - box.min.y),box.max.z);
                initGrid(- model_center.y);
                scene.add(modelShow);
                initPosition = true;


            }, onProgress, onError);
        } catch (e) {
            initErrorModel();
        }
    } else if (model_url.indexOf('.json') > 0) {
        // json loader
        var objectLoader = new THREE.ObjectLoader();
        try {
            objectLoader.load(model_url, function (obj) {
                console.log(model_url);
                modelShow.add( obj);
                var box = new THREE.Box3();
                //通过传入的object3D对象来返回当前模型的最小大小，值可以使一个mesh也可以使group
                box.expandByObject(modelShow);
                model_center = box.getCenter();
                obj.position.y = - model_center.y;
                camera.position.z = returnPosition_z((box.max.y - box.min.y),box.max.z);
                cameraResetPosition = returnPosition_z((box.max.y - box.min.y),box.max.z);
                initGrid(- model_center.y);
                initPosition = true;
                scene.add(obj);
            }, onProgress, onError);
        } catch (e) {
            initErrorModel();
        }
    } else if (model_url.indexOf('.gltf') > 0) {
        var loader = new THREE.GLTFLoader();
        try {
            loader.load(model_url, function (gltf) {

                modelShow = gltf.scene;
                cameraResetPosition = 1;
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        if (child.geometry.boundingSphere < 1) {
                            camera.position.z = returnPosition_z(2,1);
                            cameraResetPosition = returnPosition_z(2,1);
                        } else if (mesh.geometry.boundingSphere < 5) {
                            camera.position.z = returnPosition_z(10,5);
                            cameraResetPosition = returnPosition_z(10,5);
                        }else if (mesh.geometry.boundingSphere < 10) {
                            camera.position.z = returnPosition_z(20,10);
                            cameraResetPosition = returnPosition_z(20,10);
                        }
                    }
                });
                initPosition = true;
                scene.add(gltf.scene);
                console.log(gltf);
            }, onProgress, onError);
        } catch (e) {
            initErrorModel();
        }
    } else if (model_url.indexOf('.stl') > 0) {
        var loader = new THREE.STLLoader();
        try {
            loader.load(model_url, function (geometry) {
                var material = new THREE.MeshPhongMaterial({
                    color: 0xff5533,
                    specular: 0x111111,
                    shininess: 200
                })
                var mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                modelShow.add( mesh);
                var box = new THREE.Box3();
                //通过传入的object3D对象来返回当前模型的最小大小，值可以使一个mesh也可以使group
                box.expandByObject(modelShow);
                model_center = box.getCenter();
                mesh.position.y = - model_center.y;
                camera.position.z = returnPosition_z( (box.max.y - box.min.y),box.max.z);
                cameraResetPosition = returnPosition_z((box.max.y - box.min.y),box.max.z);
                console.log(model_center.y);
                console.log(camera.position);
                initGrid(- model_center.y);
                scene.add(mesh);
                initPosition = false;
            }, onProgress, onError);
        } catch (e) {
            initErrorModel();
        }

    } else {
        initErrorModel();
    }
}

var controls;
function  returnPosition_z(model_h,position_z_max) {
    return 1.414 * Math.abs(model_h) + position_z_max;
}
function initControls() {           //控制脚本
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.enableDamping = true;               //定义可以拖拽
    controls.dampingFactor = 0.3;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.3;                 //控制旋转速度
    controls.zoomSpeed = 0.5;                   //缩放速度
    controls.autoRotateSpeed = 0.6;             //自动旋转速度
    controls.dampingFactor = 0.6;
    controls.autoRotate = false;                //控制是否自动旋转

}

// model loader


function render() {
    renderer.render(scene, camera);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    render();
    renderer.setSize(window.innerWidth, window.innerHeight);
    //controls.handleResize();
}

function animate() {
    render();
    controls.update();

    if (mixers.length > 0) {

        for (var i = 0; i < mixers.length; i++) {

            mixers[i].update(clock.getDelta());

        }

    }
    requestAnimationFrame(animate);
    if (fontModel) {
        fontModel.lookAt(camera.position);
    }
    console.log(modelShow);
    if (modelShow.children.length > 0 && !initPosition) {
        console.log(camera.rotation);
        camera.position.set(0, 0, cameraResetPosition);
        initPosition = true;
    }
}


function draw() {       //初始化方法

    getModelUrl();
    initCamera();
    initRender();
    initScene();
    initLoader();
    initLight();
    initControls();
    animate();

    window.onresize = onWindowResize;
}
