import render, subprocess, sys, time
W, H = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
n = int(render.DUR*render.FPS)
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '60',
                      '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p',
                      '-profile:v', 'high', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
st = time.time()
for i in range(n):
    p.stdin.write(render.render(i, W, H).tobytes())
    if i % 30 == 0: print(i, round(time.time() - st), flush=True)
p.stdin.close(); p.wait(); print('done', round(time.time() - st))
