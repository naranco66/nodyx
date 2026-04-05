/**
 * Nodyx NoiseGate — AudioWorkletProcessor
 *
 * Porte de bruit avec attaque/release douces (évite les claquements).
 * Insérée dans la chaîne locale AVANT le filtre passe-haut.
 *
 * Paramètres :
 *   threshold  — seuil linéaire (0–1). Convertir dBFS : 10^(dB/20)
 *                ex. -50 dBFS → 0.003162
 *   attack     — temps de montée en secondes (défaut 2ms)
 *   release    — temps de descente en secondes (défaut 80ms)
 */
class NoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [
      { name: 'threshold', defaultValue: 0.003162, minValue: 0.0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'attack',    defaultValue: 0.002,    minValue: 0.0001, maxValue: 0.5,  automationRate: 'k-rate' },
      { name: 'release',   defaultValue: 0.08,     minValue: 0.001,  maxValue: 2.0,  automationRate: 'k-rate' },
    ]
  }

  constructor () {
    super()
    this._gateGain = 0.0   // état courant de la porte (0 = fermée, 1 = ouverte)
  }

  process (inputs, outputs, parameters) {
    const input  = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const threshold = parameters.threshold[0]
    const attack    = parameters.attack[0]
    const release   = parameters.release[0]

    // Coefficients par sample pour attaque/release lisses
    const attackCoef  = Math.exp(-1.0 / (sampleRate * attack))
    const releaseCoef = Math.exp(-1.0 / (sampleRate * release))

    const channelCount = Math.min(input.length, output.length)

    for (let c = 0; c < channelCount; c++) {
      const inBuf  = input[c]
      const outBuf = output[c]

      for (let i = 0; i < inBuf.length; i++) {
        const level = Math.abs(inBuf[i])

        // Mise à jour du gain de porte (attaque si signal > seuil, release sinon)
        if (level > threshold) {
          this._gateGain = 1.0 - (1.0 - this._gateGain) * attackCoef
        } else {
          this._gateGain *= releaseCoef
        }

        outBuf[i] = inBuf[i] * this._gateGain
      }
    }

    return true
  }
}

registerProcessor('nodyx-noise-gate', NoiseGateProcessor)
