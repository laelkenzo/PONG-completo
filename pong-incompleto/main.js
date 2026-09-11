// Aluno: Lael Kenzo Hayashi - RA: 176.550

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Centro
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();
let corBarraDireita = new Float32Array([0.0, 0.0, 1.0]);

let verticesBarraEsquerda = verticesBarra();
let corBarraEsquerda = new Float32Array([0.0, 1.0, 0.0]);

let verticesBolaCentro = verticesBola();
let corBolaCentro = new Float32Array([1.0, 0.0, 0.0]);

// --------------------------------------------------
// TRANSFORMAÇÕES E ESTADOS INICIAIS
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);
let MbarraDireita = m3.translation(0.9, 0.0);
let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
uniform mat3 u_transform;
out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;
uniform vec3 uColor;
out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}
`;

// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");

// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    atualizaAnimacao();

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarra(vertices, cor, transformMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform3fv(colorLocation, cor);
    gl.uniformMatrix3fv(transformLocation, false, transformMatrix);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / numComponents);
}

function drawBarraEsquerda(){
    drawBarra(verticesBarraEsquerda, corBarraEsquerda, MbarraEsquerda);
}

function drawBarraDireita(){
    drawBarra(verticesBarraDireita, corBarraDireita, MbarraDireita);
}

function drawBolaCentro(){
    drawBarra(verticesBolaCentro, corBolaCentro, MbolaCentro);
}

// --------------------------------------------------
// CONTROLE DO TECLADO
// --------------------------------------------------

const keys = {
    'w': false,
    's': false,
    'ArrowUp': false,
    'ArrowDown': false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// --------------------------------------------------
// PARÂMETROS E LÓGICA DE ANIMAÇÃO
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;
const velocidadeBarra = 0.02;

let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.01;
let tyBola_offset = 0.01;
const raioBola = 0.05;

function atualizaAnimacao(){
    // 1. Atualizar posição das barras com limite de tela (-0.8 a 0.8 considera a altura da barra)
    if (keys['w'] && tyBE < 0.8) tyBE += velocidadeBarra;
    if (keys['s'] && tyBE > -0.8) tyBE -= velocidadeBarra;
    if (keys['ArrowUp'] && tyBD < 0.8) tyBD += velocidadeBarra;
    if (keys['ArrowDown'] && tyBD > -0.8) tyBD -= velocidadeBarra;

    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);

    // 2. Atualizar posição da bola
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // 3. Colisão da bola com as paredes superior e inferior
    if (tyBola > (1.0 - raioBola) || tyBola < (-1.0 + raioBola)) {
        tyBola_offset = -tyBola_offset;
    }

    // 4. Colisão da bola com a Barra Esquerda
    // Coordenada X central = -0.9, meia-largura = 0.05, meia-altura = 0.2
    if (txBola - raioBola < -0.85 && txBola + raioBola > -0.95 &&
        tyBola - raioBola < tyBE + 0.2 && tyBola + raioBola > tyBE - 0.2) {
        txBola_offset = Math.abs(txBola_offset); // Inverte direção para a direita
    }

    // 5. Colisão da bola com a Barra Direita
    // Coordenada X central = 0.9, meia-largura = 0.05, meia-altura = 0.2
    if (txBola + raioBola > 0.85 && txBola - raioBola < 0.95 &&
        tyBola - raioBola < tyBD + 0.2 && tyBola + raioBola > tyBD - 0.2) {
        txBola_offset = -Math.abs(txBola_offset); // Inverte direção para a esquerda
    }

    // 6. Reset (Ponto marcado ao sair pelos limites laterais)
    if (txBola > 1.0 || txBola < -1.0) {
        txBola = 0.0;
        tyBola = 0.0;
        // txBola_offset não é invertido aqui para manter a aleatoriedade direcional básica de quem marca o ponto.
    }

    MbolaCentro = m3.translation(txBola, tyBola);
}

// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();