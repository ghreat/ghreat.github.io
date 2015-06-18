// ------------------
// GLSL Effect
// ------------------
//
// Little WebGL fragment shader setup
// from glsl.heroku.com
// ------------------


var Effect = ( function () {

	// Private variables

	var quality = 1,
		code,
		canvas,
		fragmentCode,
		gl,
		buffer,
		currentProgram,
		compileButton,
		vertex_position,
		paused = true,
		parameters = {
			start_time		: Date.now(),
			time			: 0,
			mouseX			: 0,
			mouseY			: 0,
			mouseXEnd		: 0,
			mouseYEnd		: 0,
			screenWidth		: 0,
			screenHeight	: 0
		};


	// Public variables

	var obj				= {};
		obj.domElement	= null;


	// Private methods

	function init ( canvasElement ) {

		canvas = document.createElement( 'canvas' );
		document.body.appendChild( canvas );
		obj.domElement = canvas;

		// Initialise WebGL

		try {

			gl = canvas.getContext( 'experimental-webgl' ) || canvas.getContext( 'webgl' );

		} catch( error ) { }

		if ( !gl ) {

			document.getElementById( 'no-webgl' ).style.display = 'block';
			throw "cannot create webgl context";

		} else {

			initWebGL();
		}
	}

	function initWebGL () {

		fragmentCode = document.getElementById( 'fragmentShader' ).textContent;

		// Create Vertex buffer (2 triangles)

		buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), gl.STATIC_DRAW );

		document.addEventListener( 'mousemove', function ( event ) {

			parameters.mouseXEnd = ( event.clientX / window.innerWidth );
			parameters.mouseYEnd = ( 1 - event.clientY / window.innerHeight );

		}, false );

		onWindowResize();
		window.addEventListener( 'resize', onWindowResize, false );

		compile();

		// first pass only ( paused = true )
		render();

		// start animation ( this should be an external call )
		animate();
	}

	function compile() {

		var program = gl.createProgram();
		var fragment = fragmentCode;

		var vs = createShader( 'attribute vec3 position; void main() { gl_Position = vec4( position, 1.0 ); }', gl.VERTEX_SHADER );
		var fs = createShader( fragment, gl.FRAGMENT_SHADER );

		if ( vs === null || fs === null ) return null;

		gl.attachShader( program, vs );
		gl.attachShader( program, fs );

		gl.deleteShader( vs );
		gl.deleteShader( fs );

		gl.linkProgram( program );

		if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

			console.error( 'VALIDATE_STATUS: ' + gl.getProgramParameter( program, gl.VALIDATE_STATUS ), 'ERROR: ' + gl.getError() );
			return;
		}

		if ( currentProgram ) gl.deleteProgram( currentProgram );
		currentProgram = program;
	}

	function createShader( src, type ) {

		var shader = gl.createShader( type );

		gl.shaderSource( shader, src );
		gl.compileShader( shader );

		if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {

			var error = gl.getShaderInfoLog( shader );
			console.error( error );

			return null;
		}

		return shader;
	}

	function onWindowResize( event ) {

		// canvas.width = ( window.innerWidth ) / quality;
		canvas.height = ( window.innerHeight - 160 ) / quality;
		canvas.width = 2.0 * canvas.height;

		// canvas.style.width = ( window.innerWidth ) + 'px';
		canvas.style.height = ( window.innerHeight - 160 ) + 'px';
		canvas.style.width = ( 2.0 * canvas.style.height ) + 'px';
		canvas.style.left = ( window.innerWidth - 2.0 * canvas.height ) / 2.0 + 'px';

		parameters.screenWidth = canvas.width;
		parameters.screenHeight = canvas.height;

		gl.viewport( 0, 0, canvas.width, canvas.height );
	}

	function animate ( ) {

		paused = false;
		parameters.start_time = Date.now();
		requestAnimationFrame( doRender );
	}

	function pause () {

		paused = true;
	}

	function show () {

		parameters.start_time = Date.now();
		render( true );
	}

	function doRender () {

		if ( !paused ) {

			requestAnimationFrame( doRender );
			render();
		}
	}

	function render( reset ) {

		if ( !currentProgram ) return;

		var body			= document.body,
			html			= document.documentElement,
			documentHeight	= Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

		parameters.mouseX += ( parameters.mouseXEnd - parameters.mouseX ) / 15;
		parameters.mouseY += ( parameters.mouseYEnd - parameters.mouseY ) / 15;

		parameters.time = Date.now() - parameters.start_time;

		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		// Load program into GPU

		gl.useProgram( currentProgram );

		// Set values to program variables

		gl.uniform1f( gl.getUniformLocation( currentProgram, 'time' ), parameters.time / 1000 );
		gl.uniform2f( gl.getUniformLocation( currentProgram, 'mouse' ), parameters.mouseX, parameters.mouseY );
		gl.uniform2f( gl.getUniformLocation( currentProgram, 'resolution' ), parameters.screenWidth, parameters.screenHeight );

		// Render geometry

		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.vertexAttribPointer( vertex_position, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vertex_position );
		gl.drawArrays( gl.TRIANGLES, 0, 6 );
		gl.disableVertexAttribArray( vertex_position );
	}

	// Public methods

	obj.init	= init;
	obj.animate	= animate;
	obj.pause	= pause;
	obj.show	= show;

	return obj;

} )();