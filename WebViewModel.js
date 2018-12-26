
        var renderer, light, mixers = [];
        var clock = new THREE.Clock();
        var modelShow;
        var bounding = {x: 0, y: 0, z: 0, radius: 0}
        var initPosition = false;
        var model_url     // 模型路径
        var resetDate = {position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Vector3(0, 0, 0),}

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

                var material = new THREE.MeshLambertMaterial({ color:'#ff4c4c',side: THREE.DoubleSide});
                fontModel = new THREE.Mesh(font, material);
                fontModel.scale.set(0.1,0.1,0.1);

                //设置位置
                fontModel.name = "error_model"
                fontModel.position.x = -(font.boundingBox.max.x*0.1 - font.boundingBox.min.x*0.1)/2; //计算出整个模型的宽度的一半
                scene.add(fontModel);
            });
        }
        var camera;
        
        function initCamera() {
            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100000);
            camera.position.set(0, 0, 100);               //摄像机位置
        }

        var scene;
        var grid
        function initScene() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xd7d7d7);
            grid= new THREE.GridHelper(200, 40, 0x000000, 0x000000);
            grid.position.y = -20;
            grid.material.opacity = 0.2;
            grid.material.transparent = true;
            scene.add(grid);

        }

        document.addEventListener("dblclick", function (ev) {
            initPosition = true;
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
                    modelShow = object;
                    modelShow.rotation.y = Math.PI / 4;
                    scene.add(object);
                    initPosition = true;

                },onProgress,onError);
            } catch (e) {
                initErrorModel();
            }
            } else if (model_url.indexOf('.obj') > 0) {

                THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());
                var loader = new THREE.OBJLoader();
                try {
                loader.load( model_url, function ( obj ) {

                    modelShow = obj;
                    console.log(obj);
                    scene.add(modelShow);

                }, onProgress, onError );
                } catch (e) {
                    initErrorModel();
                }
            } else if (model_url.indexOf('.json') > 0) {
                // json loader
                var objectLoader = new THREE.ObjectLoader();
                try {
                objectLoader.load(model_url, function (obj) {
                    console.log(model_url);
                    modelShow = obj;
                    modelShow.rotation.y = Math.PI / 4;
                    initPosition = true;
                    scene.add(obj);
                },onProgress,onError);
                } catch (e) {
                    initErrorModel();
                }
            } else if (model_url.indexOf('.gltf') > 0) {
                var loader = new THREE.GLTFLoader();
                try {
                loader.load(model_url, function (gltf) {
                    gltf.scene.traverse(function (child) {
                        if (child.isMesh) {
                            if (mesh.geometry.boundingSphere < 1) {
                                mesh.scale.set(100, 100, 100);
                            } else if (mesh.geometry.boundingSphere < 10) {
                                mesh.scale.set(20, 20, 20);
                            }
                        }
                    });
                    modelShow = gltf.scene;
                    modelShow.rotation.y = Math.PI / 4;
                    scene.add(gltf.scene);
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
                        console.log(geometry);
                        var mesh = new THREE.Mesh(geometry, material);
                        if (mesh.geometry.boundingSphere < 1) {
                            mesh.scale.set(100, 100, 100);
                        } else if (mesh.geometry.boundingSphere < 10) {
                            mesh.scale.set(20, 20, 20);
                        }
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        modelShow = mesh;
                        modelShow.rotation.y = Math.PI / 4;
                        scene.add(mesh);
                    },onProgress,onError);
                } catch (e) {
                    initErrorModel();
                }

            }else {
                initErrorModel();
                }
        }

        var controls;

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
            if(fontModel) {
                fontModel.lookAt(camera.position);
            }
            if (modelShow && initPosition) {
                console.log(modelShow);
                if(!modelShow.isMesh){
                    console.log('ismesh');
                modelShow.traverse(function (child) {
                    if (child.type == 'SkinnedMesh' || child.type == 'Mesh') {
                        camera.position.set(child.geometry.boundingSphere.center.x, child.geometry.boundingSphere.center.y*2, child.geometry.boundingSphere.center.z + 2 * child.geometry.boundingSphere.radius);
                        resetDate.position = camera.position;
                        resetDate.rotation = camera.rotation;
                        console.log(resetDate);
                        initPosition = false;
                        return;
                    }
                })
                }else{
                    console.log('notmesh');
                    if(modelShow.geometry.boundingSphere.radius < 0.5){
                            camera.position.set(modelShow.geometry.boundingSphere.center.x, modelShow.geometry.boundingSphere.center.y*2, modelShow.geometry.boundingSphere.center.z + 500 * modelShow.geometry.boundingSphere.radius);
                            resetDate.position = camera.position;
                            resetDate.rotation = camera.rotation;
                            console.log(resetDate);
                            initPosition = false;
                            return;
                    }

                }

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
