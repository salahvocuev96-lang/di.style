import render, cv2, numpy as np, sys
ts = [float(a) for a in sys.argv[1:]] or list(np.arange(0, 12, 0.5))
ims = []
for t in ts:
    im = render.render(int(round(t*60)))[..., ::-1]
    im = cv2.resize(im, (480, 270), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f'{t:.1f}', (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    ims.append(im)
while len(ims) % 4: ims.append(np.zeros_like(ims[0]))
rows = [np.hstack(ims[i:i+4]) for i in range(0, len(ims), 4)]
cv2.imwrite('contact.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 90])
