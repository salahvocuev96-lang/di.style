# DS — анимация золотой вышивки

12-секундная заставка: золотая нить вышивает логотип DS на чёрном трикотаже.
Видео рендерится собственным процедурным рендерером (Python + NumPy/Numba/OpenCV), без готовых футажей и нейросетей.

## Файлы

- `ds-embroidery-16x9.mp4` — 1920×1080, 60 fps, H.264, звук AAC
- `ds-embroidery-1x1.mp4` — 1080×1080, 60 fps
- `ds-embroidery-9x16.mp4` — 1080×1920, 60 fps
- `ds-embroidery-16x9-silent.mp4` — основная версия без звука
- `src/` — исходники

## Как пересобрать

```bash
pip install numpy scipy opencv-python-headless numba pillow
npm pack @fontsource/gelasio && tar xzf fontsource-gelasio-*.tgz
cp package/files/gelasio-latin-700-normal.woff src/
cd src
python3 precompute.py                  # карты ткани и стежков (~1.5 ГБ .npy, ~3 мин)
python3 make_video.py 1920 1080 v169.mp4   # ~30 мин на 4 ядрах
python3 audio.py                       # audio.wav, синхронно со стежками
ffmpeg -i v169.mp4 -i audio.wav -c:v copy -c:a aac -b:a 192k -shortest out.mp4
```

Шрифт букв — Gelasio Bold (SIL OFL), метрически совместимый с Georgia Bold, которой набран логотип на сайте.
