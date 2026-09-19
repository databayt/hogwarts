# Performance report — after-2026-09-19

Build `1789801682856` · measured from **RW** through Cloudflare **JNB**. Timings are lab medians from one vantage point, not field data; bytes are exact.

## Where the time goes before the browser

| tier | n | min | p50 | p95 |
| --- | --- | --- | --- | --- |
| edge (cached static chunk) | 26 | 101 ms | 112 ms | 130 ms |
| origin (container, no database) | 26 | 322 ms | 333 ms | 362 ms |
| origin + tenant lookup (manifest) | 26 | 310 ms | 326 ms | 383 ms |
| public page (login HTML) | 11 | 383 ms | 398 ms | 886 ms |

**Database round trip** (container → Neon, `SELECT 1` on a warm pool): min 90 ms · p50 91 ms · p95 308 ms · p99 844 ms — p50 FAIL, p95 FAIL.

## Public first screens — document payload

| url | on the wire | HTML | RSC flight data | share of HTML | encoding |
| --- | --- | --- | --- | --- | --- |
| https://balqalam.com/ar | 23 KB | 102 KB | 29 KB | 29% | gzip |
| https://demo.balqalam.com/ar/login | 268 KB | 1129 KB | 1117 KB | 99% | gzip |

## Sign-in — profile `none-local`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 40 ms | 8 ms | 0 ms | 20.6 KB | 79.1 KB | 67.2 KB | 340.1 KB | 736.4 KB | 36 | 0 ms | 0 ms |

## Page loads — profile `none-local`

| role · route · mode | TTFB | doc wait | LCP | CLS | TBT | req | total | HTML wire | HTML decoded | flight | JS | prefetch | LCP verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard cold | 22 ms | 21 ms | 1420 ms | 0.043 | 0 ms | 157 | 1761.4 KB | 299.6 KB | 1371.1 KB | 1212.3 KB | 870.5 KB | 47 | PASS |
| admin /attendance cold | 7 ms | 6 ms | 1068 ms | 0.078 | 0 ms | 203 | 1426.9 KB | 284.9 KB | 1244.3 KB | 1150.4 KB | 648.9 KB | 79 | PASS |
| admin /students cold | 9 ms | 9 ms | 628 ms | 0.033 | 0 ms | 196 | 1667.1 KB | 288.7 KB | 1327.1 KB | 1170.3 KB | 749.6 KB | 87 | PASS |
| admin /grades cold | 8 ms | 7 ms | 884 ms | 0.033 | 0 ms | 164 | 1461.6 KB | 289.3 KB | 1389.7 KB | 1192 KB | 667.3 KB | 59 | PASS |
| teacher /dashboard cold | 9 ms | 9 ms | 1332 ms | 0.033 | 0 ms | 150 | 1861 KB | 303 KB | 1389.5 KB | 1223.1 KB | 737.1 KB | 44 | PASS |
| teacher /attendance cold | 6 ms | 6 ms | 996 ms | 0.034 | 0 ms | 153 | 1578.7 KB | 282.5 KB | 1211.8 KB | 1150.2 KB | 808.7 KB | 47 | PASS |
| teacher /students cold | 7 ms | 6 ms | 868 ms | 0.033 | 0 ms | 178 | 1701.5 KB | 287.2 KB | 1318.8 KB | 1170.2 KB | 792.7 KB | 75 | PASS |
| teacher /grades cold | 7 ms | 6 ms | 868 ms | 0.033 | 0 ms | 144 | 1632.9 KB | 287.9 KB | 1381.4 KB | 1191.9 KB | 847.3 KB | 47 | PASS |

## Initial JavaScript per tracked route (static, gzip)

| route | files | JS | CSS | verdict | heavy libraries loaded before hydration |
| --- | --- | --- | --- | --- | --- |
| /announcements | 57 | 753.5 KB | 90.2 KB | FAIL | country-state-city, framer-motion, libphonenumber, socket.io |
| /finance | 53 | 698.8 KB | 90.2 KB | FAIL | framer-motion, recharts, socket.io |
| /students | 54 | 685.3 KB | 90.2 KB | FAIL | framer-motion, lottie, socket.io |
| /dashboard | 48 | 681.2 KB | 90.2 KB | FAIL | framer-motion, recharts, socket.io |
| /teachers | 52 | 674.9 KB | 90.2 KB | FAIL | framer-motion, lottie, socket.io |
| /grades | 51 | 592 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /classrooms | 51 | 588.9 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /attendance | 50 | 587.6 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /exams | 48 | 574.5 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /timetable | 43 | 515.3 KB | 90.8 KB | WARN | framer-motion, socket.io |
| /library | 40 | 483.6 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /my-assignments | 39 | 480.3 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /notifications | 40 | 479.9 KB | 90.2 KB | WARN | framer-motion, socket.io |
| /parent | 38 | 477.9 KB | 90.2 KB | WARN | framer-motion, socket.io |
| / | 33 | 470.7 KB | 168.4 KB | WARN | gsap, lottie, swiper |
| /messages | 30 | 365.8 KB | 90.2 KB | WARN | socket.io |
| /login | 25 | 309.8 KB | 90.2 KB | WARN | prisma-client-browser |

### Libraries in initial JS that serve a click, not a render

| library | routes | examples |
| --- | --- | --- |
| mermaid | 1 | /sales |
| prisma-client-browser | 10 | /staff /exams/qbank /exams/generate/templates /dashboard/settings /compliance /compliance |

## Against the baseline (baseline-2026-09-19)

| metric | baseline | now | change |  |
| --- | --- | --- | --- | --- |
| /dashboard initial JS | 681.2 KB | 681.2 KB | 0% |  |
| /attendance initial JS | 587.6 KB | 587.6 KB | 0% |  |
| /students initial JS | 685.3 KB | 685.3 KB | 0% |  |
| /teachers initial JS | 674.9 KB | 674.9 KB | 0% |  |
| /grades initial JS | 592 KB | 592 KB | 0% |  |
| /finance initial JS | 698.8 KB | 698.8 KB | 0% |  |
| /announcements initial JS | 753.5 KB | 753.5 KB | 0% |  |
| /timetable initial JS | 515.3 KB | 515.3 KB | 0% |  |
| /messages initial JS | 365.8 KB | 365.8 KB | 0% |  |
| /notifications initial JS | 479.9 KB | 479.9 KB | 0% |  |
| /library initial JS | 483.6 KB | 483.6 KB | 0% |  |
| /classrooms initial JS | 588.9 KB | 588.9 KB | 0% |  |
| /exams initial JS | 574.5 KB | 574.5 KB | 0% |  |
| /parent initial JS | 477.9 KB | 477.9 KB | 0% |  |
| /my-assignments initial JS | 480.3 KB | 480.3 KB | 0% |  |
| / initial JS | 470.7 KB | 470.7 KB | 0% |  |
| /login initial JS | 309.8 KB | 309.8 KB | 0% |  |
