
    var renderer,light,mixers = [];
    var clock = new THREE.Clock();
    var modelShow;
    var bounding = {x:0,y:0,z:0,radius:0}
    var initPosition = false;
    var model_url = 'models/json/teapot-claraio.json';
    var resetDate = {position:new THREE.Vector3(0,0,0),rotation:new THREE.Vector3(0,0,0),}
    function initRender() {                 //渲染方式
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });

        renderer.shadowMap.enabled = true;
        renderer.setSize(window.innerWidth,window.innerHeight);
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0xB9D3EE);           //场景渲染颜色  ffffff 为白色，可以调低 dddddd 为浅灰色
        document.getElementById("container").appendChild(renderer.domElement);

    }

    var camera;
    function initCamera() {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100000);
        camera.position.set(0, 0, 100);               //摄像机位置
    }
    var scene;
    function initScene() {
     scene = new THREE.Scene();

     }
     document.addEventListener("dblclick",function (ev) {
         initPosition = true;
     })
    function gradeChange() {            // 获取模型的路径
        var objS = document.getElementById("mySelect");
        var grade = objS.options[objS.selectedIndex].value;
        if(grade == model_url){return;}
        model_url = grade;          // 模型路径传入
        console.log(model_url);
        disposeScene();         // 去掉场景内部的其他模型；
        initLoader();       // 开始加载模型；
    }
    function initLight() {      //灯光渲染
        light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        light.position.set( 0, 200, 0 );
        scene.add( light );

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 200, 100 );
        light.castShadow = true;
        light.shadow.camera.top = 180;
        light.shadow.camera.bottom = - 100;
        light.shadow.camera.left = - 120;
        light.shadow.camera.right = 120;
        scene.add( light );
    }
    function disposeScene() {
                console.log(scene);
                scene.remove(scene.children[scene.children.length-1]);
                console.log(scene);
    }
    function initLoader() {
        // ========   fbx loader
        console.log(model_url.indexOf('.fbx'));
        if(model_url.indexOf('.fbx')>0){

                     var loader = new THREE.FBXLoader();    // 加载fbx 模型
                    loader.load( model_url, function ( object ) {

                        object.mixer = new THREE.AnimationMixer( object );
                        mixers.push( object.mixer );

                        var action = object.mixer.clipAction( object.animations[ 0 ] );
                        action.play();

                        object.traverse( function ( child ) {

                            if ( child.isMesh ) {

                                child.castShadow = true;
                                child.receiveShadow = true;
                            }

                        } );
                        object.position.y = -50;
                        modelShow = object;
                        scene.add( object );
                        initPosition  = true;

                    } );
        }else if(model_url.indexOf('obj')>0){

           // ======  objloader======
            var onProgress = function ( xhr ) {

                if ( xhr.lengthComputable ) {

                    var percentComplete = xhr.loaded / xhr.total * 100;
                    console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

                }

            };

            var onError = function () { };

            THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

            var loader = new THREE.MTLLoader();
            loader.load( 'models/obj/male02/male02.mtl', function ( materials ) {
                loader.setPath('models/obj/male02/')
                    materials.preload();

                    new THREE.OBJLoader()
                        .setMaterials( materials )
                        .load( 'models/obj/male02/male02.obj', function ( object ) {
                            modelShow = object;
                            initPosition = true;
                            scene.add( object );

                        }, onProgress, onError );


                } );
        }else {
            // json loader
            var objectLoader = new THREE.ObjectLoader();
            objectLoader.load( model_url, function ( obj ) {
                console.log(model_url);
                modelShow = obj;
                initPosition = true;
                scene.add( obj );
            } );
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

        if ( mixers.length > 0 ) {

            for ( var i = 0; i < mixers.length; i ++ ) {

                mixers[ i ].update( clock.getDelta() );

            }

        }
        requestAnimationFrame(animate);
        if(modelShow && initPosition){
            console.log(modelShow);
            modelShow.traverse(function (child) {
                if(child.type == 'SkinnedMesh'||child.type == 'Mesh'){
                    camera.position.set(child.geometry.boundingSphere.center.x,child.geometry.boundingSphere.center.y,child.geometry.boundingSphere.center.z + 2*child.geometry.boundingSphere.radius);
                    resetDate.position = camera.position;
                    resetDate.rotation = camera.rotation;
                    console.log(resetDate);
                    initPosition = false;
                    return;
                }
            })

        }
    }





    function draw() {       //初始化方法
        initCamera();
        initRender();
        initScene();
        initLoader();
        initLight();
        initControls();
        animate();
        window.onresize = onWindowResize;
    }