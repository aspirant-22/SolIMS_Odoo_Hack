/**
 * @AUTHOR: Garima Mittal
 * @FILE: qrCodeSvg.js
 * @RESPONSIBILITY: Zero-dependency ISO/IEC 18004 compliant QR Code Matrix & SVG Generator for SolIMS Inverter QR Stickers & Commissioning Certificates.
 */

// GF(256) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11d)
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsComputePoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const root = GF256_EXP[i];
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(dataBytes, ecCount) {
  const genPoly = rsComputePoly(ecCount);
  const remainder = new Array(ecCount).fill(0);

  for (let i = 0; i < dataBytes.length; i++) {
    const factor = dataBytes[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < ecCount; j++) {
      remainder[j] ^= gfMul(genPoly[j], factor);
    }
  }
  return remainder;
}

// Version configs for standard byte-mode URLs (Version 3: 29x29, holds up to 70 bytes at L, 55 at M; Version 4: 33x33)
const QR_SPECS = [
  null,
  { version: 1, size: 21, totalBytes: 26, ecBytes: 7, dataBytes: 19 },
  { version: 2, size: 25, totalBytes: 44, ecBytes: 10, dataBytes: 34 },
  { version: 3, size: 29, totalBytes: 70, ecBytes: 15, dataBytes: 55 },
  { version: 4, size: 33, totalBytes: 100, ecBytes: 20, dataBytes: 80 }
];

export function generateQrMatrix(text) {
  const utf8Encoder = new TextEncoder();
  const textBytes = utf8Encoder.encode(text);

  // Pick smallest sufficient QR version
  let spec = QR_SPECS.find((s) => s && s.dataBytes >= textBytes.length + 3);
  if (!spec) spec = QR_SPECS[4]; // fallback to Version 4

  const size = spec.size;
  // Initialize matrix: 0=light, 1=dark, -1=empty
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));

  // 1. Finder patterns at top-left, top-right, bottom-left
  const addFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[row][col] = 1;
          } else {
            matrix[row][col] = 0;
          }
        } else {
          matrix[row][col] = 0; // Separator
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Alignment pattern for Version 2+
  if (spec.version >= 2) {
    const alignPos = spec.version === 2 ? 18 : spec.version === 3 ? 22 : 26;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const row = alignPos + r;
        const col = alignPos + c;
        if (matrix[row][col] === -1) {
          matrix[row][col] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0;
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = (i % 2 === 0 ? 1 : 0);
    if (matrix[i][6] === -1) matrix[i][6] = (i % 2 === 0 ? 1 : 0);
  }

  // 4. Dark module
  matrix[size - 8][8] = 1;

  // 5. Build bitstream: Mode (0100 for Byte) + Count (8 bits) + Data + Terminator + Padding
  const bitstream = [];
  const pushBits = (val, count) => {
    for (let i = count - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  };

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for v1-9 byte mode)
  pushBits(textBytes.length, 8);
  // Data bytes
  for (const b of textBytes) {
    pushBits(b, 8);
  }
  // Terminator: up to 4 zero bits
  const neededZeros = Math.min(4, spec.dataBytes * 8 - bitstream.length);
  pushBits(0, neededZeros);
  // Pad to next byte boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Pad bytes (0xEC, 0x11)
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bitstream.length < spec.dataBytes * 8) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bitstream to bytes
  const dataBytes = [];
  for (let i = 0; i < bitstream.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitstream[i + j];
    }
    dataBytes.push(byteVal);
  }

  // Reed-Solomon Error Correction Bytes
  const ecBytes = rsEncode(dataBytes, spec.ecBytes);
  const finalCodewords = [...dataBytes, ...ecBytes];

  // Final bit array to place
  const finalBits = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((cw >> b) & 1);
    }
  }

  // 6. Place data bits in zig-zag columns
  let bitIndex = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // skip vertical timing column
    const leftCol = rightCol - 1;

    for (let step = 0; step < size; step++) {
      const row = upward ? (size - 1 - step) : step;
      for (const col of [rightCol, leftCol]) {
        if (matrix[row][col] === -1) {
          const bit = bitIndex < finalBits.length ? finalBits[bitIndex++] : 0;
          // Apply standard mask 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0 ? 1 : 0;
          matrix[row][col] = bit ^ mask;
        }
      }
    }
    upward = !upward;
  }

  // 7. Format bits for Error Correction Level L (01), Mask 0 (000) => 01000
  // Standard format string with BCH(15, 5) and XOR mask 0x5412: 111011111000100
  const formatString = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  // Write format info around top-left
  const formatCoordsTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoordsTopLeft[i];
    matrix[r][c] = formatString[i];
  }
  // Write format info at bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatString[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatString[7 + i];
  }

  return matrix;
}

/**
 * Generates an SVG path string for the QR code modules.
 */
export function getQrSvgPath(matrix) {
  let path = '';
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        path += `M${c},${r}h1v1h-1z `;
      }
    }
  }
  return path;
}

/**
 * React Component rendering an inline vector SVG QR code.
 */
export function InlineSvgQrCode({
  value,
  size = 140,
  darkColor = '#0F291E',
  lightColor = '#FFFFFF',
  className = ''
}) {
  const matrix = generateQrMatrix(value || 'https://solims.com');
  const matrixSize = matrix.length;
  const quietZone = 2;
  const viewBoxSize = matrixSize + quietZone * 2;
  const path = getQrSvgPath(matrix);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      aria-label={`QR Code for ${value}`}
      role="img"
    >
      <rect width="100%" height="100%" fill={lightColor} rx="4" />
      <g transform={`translate(${quietZone}, ${quietZone})`} fill={darkColor}>
        <path d={path} />
      </g>
    </svg>
  );
}
