
const fs = require('fs');
const path = require('path');

let tts = null;

const loadKokoro = async () => {
  if (tts) {
    return tts;
  }

  console.log('Loading Kokoro TTS model...');

  const { KokoroTTS } = await import('kokoro-js');

  tts = await KokoroTTS.from_pretrained(
    'onnx-community/Kokoro-82M-v1.0-ONNX',
    {
      dtype: 'q8',
      device: 'cpu'
    }
  );

  console.log('Kokoro TTS model loaded');

  return tts;
};

const generateSpeech = async (text, outputFile) => {
  if (!text || !text.trim()) {
    throw new Error('Text is required for speech generation');
  }

  const model = await loadKokoro();

  console.log('Generating speech...');

  const audio = await model.generate(text, {
    voice: 'af_heart'
  });

  const directory = path.dirname(outputFile);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }

  console.log('Saving audio to:', outputFile);

  await audio.save(outputFile);

  console.log('Audio save completed');

  if (!fs.existsSync(outputFile)) {
    throw new Error(
      'Voiceover file was not created'
    );
  }

  const stats = fs.statSync(outputFile);

  console.log('Voiceover file size:', stats.size);

  if (stats.size === 0) {
    throw new Error(
      'Voiceover file was created but is empty'
    );
  }

  return outputFile;
};

module.exports = {
  generateSpeech
};