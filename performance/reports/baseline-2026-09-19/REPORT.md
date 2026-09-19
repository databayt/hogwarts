# Performance report — baseline-2026-09-19

Build `1789709863481` · measured from **RW** through Cloudflare **JNB**. Timings are lab medians from one vantage point, not field data; bytes are exact.

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

## Sign-in — profile `mobile-nav`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2276 ms | 605 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 415.1 KB | 1056.8 KB | 37 | 1163 ms | 5915 ms |

## Sign-in — profile `mobile`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2272 ms | 625 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 414.8 KB | 1056 KB | 37 | 1214 ms | 7402 ms |

## Sign-in — profile `none-login`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 932 ms | 595 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 410.8 KB | 1050.5 KB | 37 | 901 ms | 2600 ms |

## Sign-in — profile `none-sw-v7`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 988 ms | 628 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 409.4 KB | 1048.4 KB | 37 | 1243 ms | 3417 ms |

## Sign-in — profile `none-sw-v8`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1044 ms | 667 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 409.5 KB | 1048.9 KB | 37 | 890 ms | 2190 ms |

## Sign-in — profile `none`

| LCP | TTFB | TBT | HTML (wire) | HTML (decoded) | flight data | JS | total | requests | sign-in action + redirect | submit → dashboard LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 980 ms | 611 ms | 0 ms | 269.1 KB | 1128.7 KB | 1116.8 KB | 408.9 KB | 1048.4 KB | 37 | — | — |

## Page loads — profile `mobile`

| role · route · mode | TTFB | doc wait | LCP | CLS | TBT | req | total | HTML wire | HTML decoded | flight | JS | prefetch | LCP verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard cold | 581 ms | 351 ms | 8692 ms | 0.014 | 871 ms | 116 | 1795.7 KB | 289.7 KB | 1371.6 KB | 1213.5 KB | 849.4 KB | 16 | FAIL |
| admin /dashboard warm | 952 ms | 952 ms | 1540 ms | 0.014 | 618 ms | 122 | 7.8 KB | 0 KB | 1371.5 KB | 1213.5 KB | 0 KB | 16 | ok |
| admin /attendance cold | 548 ms | 332 ms | 9400 ms | 0.073 | 296 ms | 93 | 2357.3 KB | 280 KB | 1246.6 KB | 1152.3 KB | 1517.6 KB | 13 | FAIL |
| admin /attendance warm | 955 ms | 954 ms | 2136 ms | 0.108 | 0 ms | 120 | 11.8 KB | 0 KB | 1246.6 KB | 1152.3 KB | 0 KB | 28 | ok |
| admin /students cold | 575 ms | 346 ms | 8352 ms | 0.073 | 330 ms | 92 | 2459.7 KB | 285 KB | 1330.5 KB | 1172.2 KB | 1610.3 KB | 11 | FAIL |
| admin /students warm | 1023 ms | 1023 ms | 1628 ms | 0.073 | 0 ms | 122 | 12.2 KB | 0 KB | 1330.5 KB | 1172.2 KB | 0 KB | 34 | ok |
| admin /grades cold | 561 ms | 355 ms | 8124 ms | 0.074 | 337 ms | 88 | 2360.4 KB | 285.4 KB | 1392 KB | 1194 KB | 1510.9 KB | 11 | FAIL |
| admin /grades warm | 1448 ms | 1447 ms | 2296 ms | 0.084 | 0 ms | 86 | 8.4 KB | 0 KB | 1392 KB | 1194 KB | 0 KB | 11 | ok |
| teacher /dashboard cold | 596 ms | 349 ms | 8852 ms | 0.013 | 909 ms | 117 | 2696.5 KB | 293 KB | 1390.8 KB | 1224.4 KB | 1761.5 KB | 12 | FAIL |
| teacher /dashboard warm | 3942 ms | 3941 ms | 4552 ms | 0.021 | 687 ms | 115 | 9.8 KB | 0 KB | 1390.8 KB | 1224.4 KB | 0 KB | 14 | FAIL |
| teacher /attendance cold | 548 ms | 332 ms | 9344 ms | 0.073 | 32 ms | 89 | 2330.4 KB | 277.5 KB | 1214.1 KB | 1152.1 KB | 1502.9 KB | 9 | FAIL |
| teacher /attendance warm | 939 ms | 939 ms | 1288 ms | 0.004 | 0 ms | 88 | 5 KB | 0 KB | 1214.1 KB | 1152.1 KB | 0 KB | 9 | PASS |
| teacher /students cold | 571 ms | 347 ms | 7288 ms | 0.073 | 339 ms | 92 | 2446.4 KB | 284.4 KB | 1321.3 KB | 1172.1 KB | 1609.2 KB | 11 | FAIL |
| teacher /students warm | 1184 ms | 1184 ms | 1832 ms | 0.073 | 0 ms | 120 | 12.4 KB | 0 KB | 1321.3 KB | 1172.1 KB | 0 KB | 32 | ok |
| teacher /grades cold | 567 ms | 348 ms | 7996 ms | 0.074 | 322 ms | 88 | 2351.5 KB | 284.9 KB | 1383.8 KB | 1193.9 KB | 1511 KB | 11 | FAIL |
| teacher /grades warm | 1068 ms | 1068 ms | 1648 ms | 0.084 | 0 ms | 86 | 4.4 KB | 0 KB | 1383.8 KB | 1193.9 KB | 0 KB | 11 | ok |

## Page loads — profile `none-sw-v7`

| role · route · mode | TTFB | doc wait | LCP | CLS | TBT | req | total | HTML wire | HTML decoded | flight | JS | prefetch | LCP verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard cold | 566 ms | 337 ms | 3524 ms | 0.033 | 0 ms | 149 | 1595.8 KB | 289.7 KB | 1371.6 KB | 1213.5 KB | 811.6 KB | 44 | WARN |
| admin /dashboard warm | 973 ms | 972 ms | 1384 ms | 0.033 | 0 ms | 95 | 14.2 KB | 0 KB | 1371.5 KB | 1213.5 KB | 0 KB | 28 | PASS |
| admin /students cold | 548 ms | 333 ms | 1972 ms | 0.033 | 36 ms | 110 | 2515 KB | 285 KB | 1330.5 KB | 1172.2 KB | 1605 KB | 31 | ok |
| admin /students warm | 1209 ms | 1209 ms | 1608 ms | 0.033 | 0 ms | 120 | 14.8 KB | 0 KB | 1330.5 KB | 1172.2 KB | 0 KB | 42 | ok |
| admin /finance cold | 597 ms | 347 ms | 2696 ms | 0.033 | 0 ms | 101 | 2370.5 KB | 285.4 KB | 1305.7 KB | 1203.6 KB | 1589.6 KB | 25 | WARN |
| admin /finance warm | 1746 ms | 1745 ms | 2092 ms | 0.033 | 0 ms | 147 | 16.3 KB | 0 KB | 1305.6 KB | 1203.5 KB | 0 KB | 42 | ok |
| admin /messages cold | 574 ms | 347 ms | 4336 ms | 0 | 0 ms | 51 | 1580 KB | 191.6 KB | 877.4 KB | 842.7 KB | 1144.7 KB | 0 | FAIL |
| admin /messages warm | 2395 ms | 2395 ms | 2736 ms | 0 | 0 ms | 51 | 4.8 KB | 0 KB | 877.4 KB | 842.7 KB | 0 KB | 0 | WARN |

## Page loads — profile `none-sw-v8`

| role · route · mode | TTFB | doc wait | LCP | CLS | TBT | req | total | HTML wire | HTML decoded | flight | JS | prefetch | LCP verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard cold | 577 ms | 348 ms | 3088 ms | 0.033 | 0 ms | 144 | 1607 KB | 289.8 KB | 1371.5 KB | 1213.5 KB | 812.5 KB | 41 | WARN |
| admin /dashboard warm | 348 ms | 348 ms | 964 ms | 0.039 | 0 ms | 96 | 28.5 KB | 0 KB | 1371.5 KB | 1213.5 KB | 0 KB | 28 | PASS |
| admin /students cold | 568 ms | 351 ms | 2068 ms | 0.033 | 37 ms | 112 | 2496.6 KB | 285 KB | 1330.5 KB | 1172.2 KB | 1583.2 KB | 32 | ok |
| admin /students warm | 333 ms | 333 ms | 1112 ms | 0.033 | 0 ms | 115 | 167.8 KB | 0 KB | 1330.5 KB | 1172.2 KB | 0 KB | 34 | PASS |
| admin /finance cold | 579 ms | 341 ms | 1748 ms | 0.034 | 0 ms | 103 | 2392.7 KB | 285.4 KB | 1305.6 KB | 1203.5 KB | 1610.6 KB | 26 | ok |
| admin /finance warm | 343 ms | 342 ms | 2120 ms | 0.033 | 0 ms | 115 | 28.7 KB | 0 KB | 1305.7 KB | 1203.6 KB | 0 KB | 36 | ok |
| admin /messages cold | 586 ms | 357 ms | 2656 ms | 0 | 0 ms | 53 | 1603.1 KB | 191.6 KB | 877.4 KB | 842.7 KB | 1143.9 KB | 0 | WARN |
| admin /messages warm | 345 ms | 344 ms | 2808 ms | 0 | 0 ms | 53 | 52.5 KB | 0 KB | 877.4 KB | 842.7 KB | 0 KB | 0 | WARN |

## Page loads — profile `none`

| role · route · mode | TTFB | doc wait | LCP | CLS | TBT | req | total | HTML wire | HTML decoded | flight | JS | prefetch | LCP verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard cold | 578 ms | 358 ms | 3240 ms | 0.033 | 0 ms | 147 | 1588.8 KB | 289.7 KB | 1371.6 KB | 1213.5 KB | 807 KB | 43 | WARN |
| admin /dashboard warm | 842 ms | 840 ms | 1396 ms | 0.033 | 0 ms | 95 | 10.4 KB | 0 KB | 1371.5 KB | 1213.5 KB | 0 KB | 28 | PASS |
| admin /attendance cold | 545 ms | 337 ms | 1552 ms | 0.045 | 32 ms | 92 | 2246 KB | 279.9 KB | 1246.6 KB | 1152.3 KB | 1493.2 KB | 18 | ok |
| admin /attendance warm | 958 ms | 957 ms | 3408 ms | 0.046 | 0 ms | 142 | 29.8 KB | 0 KB | 1246.7 KB | 1152.3 KB | 0 KB | 60 | WARN |
| admin /students cold | 573 ms | 345 ms | 3420 ms | 0.033 | 40 ms | 108 | 2490.3 KB | 285 KB | 1330.5 KB | 1172.2 KB | 1582.4 KB | 29 | WARN |
| admin /students warm | 1128 ms | 1128 ms | 1536 ms | 0.033 | 0 ms | 120 | 17.9 KB | 0 KB | 1330.5 KB | 1172.2 KB | 0 KB | 38 | ok |
| admin /teachers cold | 586 ms | 357 ms | 2580 ms | 0.033 | 43 ms | 100 | 2475.7 KB | 284.4 KB | 1330.2 KB | 1172.6 KB | 1572.9 KB | 23 | WARN |
| admin /teachers warm | 1635 ms | 1634 ms | 2040 ms | 0.033 | 0 ms | 130 | 18.7 KB | 0 KB | 1330.2 KB | 1172.6 KB | 0 KB | 49 | ok |
| admin /grades cold | 578 ms | 359 ms | 2668 ms | 0.033 | 31 ms | 93 | 2255.2 KB | 285.4 KB | 1392 KB | 1194 KB | 1485.4 KB | 19 | WARN |
| admin /grades warm | 1575 ms | 1574 ms | 1900 ms | 0.033 | 0 ms | 143 | 14.9 KB | 0 KB | 1392.1 KB | 1194 KB | 0 KB | 44 | ok |
| admin /finance cold | 586 ms | 364 ms | 2920 ms | 0.033 | 0 ms | 96 | 2364.4 KB | 285.4 KB | 1305.6 KB | 1203.5 KB | 1589.1 KB | 20 | WARN |
| admin /finance warm | 1752 ms | 1751 ms | 2092 ms | 0.033 | 0 ms | 144 | 14.7 KB | 0 KB | 1305.6 KB | 1203.5 KB | 0 KB | 48 | ok |
| admin /announcements cold | 577 ms | 344 ms | 2652 ms | 0.035 | 40 ms | 115 | 2433.4 KB | 285.4 KB | 1372.1 KB | 1168.9 KB | 1659.8 KB | 31 | WARN |
| admin /announcements warm | 1092 ms | 1091 ms | 1480 ms | 0.036 | 0 ms | 107 | 12 KB | 0 KB | 1372.1 KB | 1168.9 KB | 0 KB | 26 | PASS |
| admin /timetable cold | 570 ms | 356 ms | 2092 ms | 0 | 0 ms | 83 | 1394 KB | 278.1 KB | 1244.8 KB | 1141.2 KB | 642 KB | 20 | ok |
| admin /timetable warm | 830 ms | 830 ms | 2728 ms | 0 | 0 ms | 143 | 26.3 KB | 0 KB | 1244.7 KB | 1141.2 KB | 0 KB | 57 | WARN |
| admin /messages cold | 554 ms | 344 ms | 4412 ms | 0 | 0 ms | 51 | 1544.5 KB | 191.6 KB | 877.4 KB | 842.7 KB | 1133.6 KB | 0 | FAIL |
| admin /messages warm | 4020 ms | 4019 ms | 4348 ms | 0 | 0 ms | 51 | 4.8 KB | 0 KB | 877.4 KB | 842.7 KB | 0 KB | 0 | FAIL |
| admin /notifications cold | 560 ms | 344 ms | 2392 ms | 0.034 | 0 ms | 91 | 1372.1 KB | 281.4 KB | 1291.1 KB | 1171.7 KB | 601.5 KB | 31 | ok |
| admin /notifications warm | 1162 ms | 1162 ms | 1564 ms | 0.033 | 0 ms | 92 | 14 KB | 0 KB | 1291.1 KB | 1171.7 KB | 0 KB | 31 | ok |
| admin /library cold | 1044 ms | 373 ms | 1880 ms | 0.001 | 0 ms | 100 | 1554 KB | 281.4 KB | 1246.3 KB | 1162.8 KB | 602.1 KB | 21 | ok |
| admin /library warm | 958 ms | 958 ms | 1320 ms | 0.001 | 0 ms | 110 | 169 KB | 0 KB | 1246.3 KB | 1162.8 KB | 0 KB | 18 | PASS |
| teacher /dashboard cold | 559 ms | 338 ms | 3140 ms | 0.033 | 0 ms | 117 | 2508.2 KB | 293 KB | 1390.9 KB | 1224.4 KB | 1731.9 KB | 27 | WARN |
| teacher /dashboard warm | 3177 ms | 3176 ms | 3588 ms | 0.033 | 0 ms | 113 | 8.4 KB | 0 KB | 1390.7 KB | 1224.4 KB | 0 KB | 25 | WARN |
| teacher /attendance cold | 552 ms | 327 ms | 1384 ms | 0.001 | 0 ms | 97 | 2236.2 KB | 277.5 KB | 1214.1 KB | 1152.1 KB | 1495.3 KB | 23 | PASS |
| teacher /attendance warm | 941 ms | 941 ms | 1276 ms | 0.001 | 0 ms | 117 | 16 KB | 0 KB | 1214.1 KB | 1152.1 KB | 0 KB | 32 | PASS |
| teacher /students cold | 627 ms | 386 ms | 2424 ms | 0.033 | 34 ms | 107 | 2503.2 KB | 284.4 KB | 1321.3 KB | 1172.1 KB | 1601.9 KB | 28 | ok |
| teacher /students warm | 1124 ms | 1123 ms | 1528 ms | 0.033 | 0 ms | 124 | 14.5 KB | 0 KB | 1321.3 KB | 1172.1 KB | 0 KB | 44 | ok |
| teacher /grades cold | 598 ms | 371 ms | 2480 ms | 0.033 | 29 ms | 116 | 2250.5 KB | 284.9 KB | 1383.8 KB | 1193.9 KB | 1486.4 KB | 31 | ok |
| teacher /grades warm | 1149 ms | 1148 ms | 1492 ms | 0.033 | 0 ms | 97 | 8.8 KB | 0 KB | 1383.8 KB | 1193.9 KB | 0 KB | 24 | PASS |
| teacher /timetable cold | 578 ms | 338 ms | 1428 ms | 0 | 0 ms | 75 | 1379.5 KB | 277.9 KB | 1236.2 KB | 1141.1 KB | 641.3 KB | 12 | PASS |
| teacher /timetable warm | 598 ms | 598 ms | 2760 ms | 0.02 | 0 ms | 157 | 19.7 KB | 0 KB | 1236.2 KB | 1141.1 KB | 0 KB | 46 | WARN |
| teacher /classrooms cold | 560 ms | 342 ms | 2728 ms | 0.033 | 35 ms | 102 | 2242.1 KB | 282.3 KB | 1300.5 KB | 1171.9 KB | 1481.4 KB | 28 | WARN |
| teacher /classrooms warm | 1028 ms | 1027 ms | 1608 ms | 0.033 | 0 ms | 135 | 14.8 KB | 0 KB | 1300.5 KB | 1171.9 KB | 0 KB | 38 | ok |
| teacher /exams cold | 579 ms | 359 ms | 2464 ms | 0.029 | 0 ms | 95 | 2222.8 KB | 283.7 KB | 1282.7 KB | 1194.3 KB | 1464.1 KB | 24 | ok |
| teacher /exams warm | 1352 ms | 1351 ms | 1752 ms | 0.029 | 0 ms | 115 | 11.5 KB | 0 KB | 1282.7 KB | 1194.3 KB | 0 KB | 28 | ok |
| guardian /dashboard cold | 553 ms | 339 ms | 1640 ms | 0.033 | 0 ms | 92 | 1581.6 KB | 295.3 KB | 1405.1 KB | 1240.9 KB | 817.6 KB | 21 | ok |
| guardian /dashboard warm | 1208 ms | 1208 ms | 1632 ms | 0.033 | 0 ms | 117 | 8.6 KB | 0 KB | 1405.1 KB | 1240.9 KB | 0 KB | 24 | ok |
| guardian /parent cold | 563 ms | 348 ms | 1336 ms | 0 | 0 ms | 105 | 1364.1 KB | 275.6 KB | 1185.4 KB | 1139.7 KB | 616 KB | 23 | PASS |
| guardian /parent warm | 1006 ms | 1005 ms | 1336 ms | 0 | 0 ms | 105 | 7.5 KB | 0 KB | 1184.4 KB | 1139.7 KB | 0 KB | 23 | PASS |
| guardian /attendance cold | 546 ms | 335 ms | 3284 ms | 0.029 | 26 ms | 124 | 2414.4 KB | 276.4 KB | 1206.9 KB | 1151.7 KB | 1660.1 KB | 29 | WARN |
| guardian /attendance warm | 941 ms | 940 ms | 2512 ms | 0.044 | 0 ms | 124 | 17.7 KB | 0 KB | 1206.9 KB | 1151.7 KB | 0 KB | 29 | WARN |
| guardian /grades cold | 552 ms | 343 ms | 1708 ms | 0.014 | 32 ms | 112 | 2427 KB | 280.5 KB | 1273.4 KB | 1185.2 KB | 1675.5 KB | 24 | ok |
| guardian /grades warm | 956 ms | 955 ms | 1336 ms | 0.014 | 0 ms | 112 | 13.8 KB | 0 KB | 1273.4 KB | 1185.2 KB | 0 KB | 24 | PASS |
| guardian /finance cold | 565 ms | 338 ms | 1512 ms | 0.033 | 0 ms | 92 | 2338 KB | 280.7 KB | 1243.8 KB | 1176.4 KB | 1596.1 KB | 18 | ok |
| guardian /finance warm | 1034 ms | 1034 ms | 1372 ms | 0.033 | 0 ms | 110 | 14.3 KB | 0 KB | 1243.8 KB | 1176.4 KB | 0 KB | 26 | PASS |
| student /dashboard cold | 572 ms | 341 ms | 2444 ms | 0.033 | 0 ms | 111 | 2500.6 KB | 293.3 KB | 1383.1 KB | 1223 KB | 1741.5 KB | 22 | ok |
| student /dashboard warm | 3439 ms | 3438 ms | 5204 ms | 0.033 | 0 ms | 153 | 31.3 KB | 0 KB | 1383.1 KB | 1223 KB | 0 KB | 46 | FAIL |
| student /my-assignments cold | 569 ms | 354 ms | 1840 ms | 0 | 0 ms | 103 | 1498.7 KB | 290.5 KB | 1781.1 KB | 1397.6 KB | 743.5 KB | 22 | ok |
| student /my-assignments warm | 1144 ms | 1143 ms | 1500 ms | 0 | 0 ms | 112 | 11.2 KB | 0 KB | 1781.1 KB | 1397.6 KB | 0 KB | 24 | PASS |
| student /grades cold | 572 ms | 351 ms | 2408 ms | 0.014 | 30 ms | 119 | 2400 KB | 281.2 KB | 1283.2 KB | 1185.8 KB | 1651.8 KB | 28 | ok |
| student /grades warm | 1138 ms | 1137 ms | 1512 ms | 0.014 | 0 ms | 110 | 8.2 KB | 0 KB | 1283.2 KB | 1185.8 KB | 0 KB | 24 | ok |
| student /timetable cold | 546 ms | 335 ms | 1228 ms | 0 | 0 ms | 110 | 1396 KB | 276.8 KB | 1231 KB | 1139.4 KB | 651.9 KB | 22 | PASS |
| student /timetable warm | 864 ms | 864 ms | 1208 ms | 0 | 0 ms | 113 | 8.9 KB | 0 KB | 1231 KB | 1139.4 KB | 0 KB | 23 | PASS |
| student /library cold | 559 ms | 330 ms | 1608 ms | 0.001 | 0 ms | 104 | 1599.2 KB | 280.7 KB | 1235.3 KB | 1162.7 KB | 605.8 KB | 26 | ok |
| student /library warm | 1061 ms | 1061 ms | 1420 ms | 0.001 | 0 ms | 115 | 17.7 KB | 0 KB | 1235.3 KB | 1162.7 KB | 0 KB | 27 | PASS |

## Navigation (click in the sidebar) — profile `mobile-nav`

| role · from → to | visual response | URL change | settled | RSC wait | transfer | response verdict | settled verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard → /attendance | 156 ms | 529 ms | 4648 ms | 339 ms | 24.4 KB | ok | FAIL |
| admin /attendance → /students | 136 ms | 1288 ms | 1415 ms | 1103 ms | 6.7 KB | ok | WARN |
| admin /students → /grades | 69 ms | 520 ms | 520 ms | — | 2.6 KB | PASS | ok |
| admin /grades → /finance | 90 ms | 66 ms | 3058 ms | 1757 ms | 3.7 KB | PASS | FAIL |
| admin /finance → /dashboard | 82 ms | 70 ms | 1621 ms | 568 ms | 4.3 KB | PASS | WARN |
| teacher /dashboard → /attendance | 371 ms | 526 ms | 4760 ms | 338 ms | 267.8 KB | WARN | FAIL |
| teacher /attendance → /students | 69 ms | 911 ms | 1804 ms | 738 ms | 139.5 KB | PASS | WARN |
| teacher /students → /timetable | 156 ms | 663 ms | 5914 ms | 577 ms | 7.2 KB | ok | FAIL |
| teacher /timetable → /dashboard | 82 ms | 68 ms | 4540 ms | 3533 ms | 3.3 KB | PASS | FAIL |

## Navigation (click in the sidebar) — profile `mobile`

| role · from → to | visual response | URL change | settled | RSC wait | transfer | response verdict | settled verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| teacher /dashboard → /attendance | 384 ms | 567 ms | 4818 ms | 352 ms | 269 KB | WARN | FAIL |

**Interaction** (click → next paint, 6 samples): median 96 ms, worst 104 ms — PASS.

## Navigation (click in the sidebar) — profile `none`

| role · from → to | visual response | URL change | settled | RSC wait | transfer | response verdict | settled verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin /dashboard → /attendance | 49 ms | 23 ms | 3343 ms | 444 ms | 18.2 KB | PASS | FAIL |
| admin /attendance → /students | 375 ms | 373 ms | 1328 ms | 1049 ms | 139.5 KB | WARN | WARN |
| admin /students → /grades | 116 ms | 383 ms | 1080 ms | 941 ms | 7 KB | ok | WARN |
| admin /grades → /finance | 25 ms | 23 ms | 2064 ms | 1347 ms | 3.2 KB | PASS | WARN |
| admin /finance → /dashboard | 25 ms | 22 ms | 1648 ms | 759 ms | 2 KB | PASS | WARN |
| teacher /dashboard → /attendance | 287 ms | 260 ms | 3439 ms | 352 ms | 14.4 KB | WARN | FAIL |
| teacher /attendance → /students | 27 ms | 23 ms | 1268 ms | 799 ms | 144.3 KB | PASS | WARN |
| teacher /students → /timetable | 31 ms | 27 ms | 5529 ms | 713 ms | 7.4 KB | PASS | FAIL |
| teacher /timetable → /dashboard | 52 ms | 47 ms | 794 ms | 3441 ms | 0.6 KB | PASS | ok |
| guardian /dashboard → /attendance | 49 ms | 23 ms | 1932 ms | 474 ms | 2.7 KB | PASS | WARN |
| guardian /attendance → /grades | 32 ms | 27 ms | 859 ms | 704 ms | 0 KB | PASS | ok |
| guardian /grades → /dashboard | 50 ms | 43 ms | 502 ms | — | 1.1 KB | PASS | ok |
| student /dashboard → /timetable | 49 ms | 21 ms | 6020 ms | 661 ms | 13 KB | PASS | FAIL |
| student /timetable → /grades | 28 ms | 23 ms | 1369 ms | 1122 ms | 0 KB | PASS | WARN |
| student /grades → /dashboard | 25 ms | 21 ms | 4292 ms | 3427 ms | 0.9 KB | PASS | FAIL |

**Interaction** (click → next paint, 28 samples): median 24 ms, worst 56 ms — PASS.

## Initial JavaScript per tracked route (static, gzip)

| route | files | JS | CSS | verdict | heavy libraries loaded before hydration |
| --- | --- | --- | --- | --- | --- |
| /announcements | 64 | 1624.3 KB | 90.2 KB | FAIL | cmdk, country-state-city, date-fns, framer-motion, libphonenumber, next-auth-client, posthog, react-day-picker, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /finance | 59 | 1569.8 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, next-auth-client, posthog, react-pdf/pdfkit, recharts, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /students | 60 | 1555.3 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, lottie, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /teachers | 59 | 1545.7 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, lottie, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /grades | 57 | 1462.2 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /classrooms | 57 | 1459 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /attendance | 56 | 1458.5 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /exams | 55 | 1445.4 KB | 90.2 KB | FAIL | cmdk, date-fns, framer-motion, next-auth-client, posthog, react-pdf/pdfkit, shiki-grammars, socket.io, sonner, tanstack-table, xlsx, zod |
| /dashboard | 49 | 750.3 KB | 90.2 KB | FAIL | date-fns, framer-motion, next-auth-client, posthog, recharts, shiki-grammars, socket.io, sonner, zod |
| /timetable | 44 | 584.4 KB | 90.8 KB | WARN | cmdk, date-fns, framer-motion, next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| /library | 41 | 552.7 KB | 90.2 KB | WARN | date-fns, framer-motion, next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| /my-assignments | 40 | 549.4 KB | 90.2 KB | WARN | date-fns, framer-motion, next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| /notifications | 41 | 549 KB | 90.2 KB | WARN | date-fns, framer-motion, next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| /parent | 39 | 547 KB | 90.2 KB | WARN | date-fns, framer-motion, next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| / | 33 | 538.6 KB | 168.4 KB | WARN | gsap, lottie, next-auth-client, posthog, shiki-grammars, sonner, swiper |
| /messages | 31 | 435 KB | 90.2 KB | WARN | next-auth-client, posthog, shiki-grammars, socket.io, sonner, zod |
| /login | 26 | 378.8 KB | 90.2 KB | WARN | next-auth-client, posthog, prisma-client-browser, shiki-grammars, sonner, zod |

### Libraries in initial JS that serve a click, not a render

| library | routes | examples |
| --- | --- | --- |
| react-pdf/pdfkit | 48 | /announcements /admission /live/dashboard /finance /students/archived /students |
| xlsx | 47 | /announcements /admission /live/dashboard /finance /students/archived /students |
| mermaid | 1 | /sales |
| prisma-client-browser | 10 | /staff /exams/qbank /exams/generate/templates /dashboard/settings /compliance /compliance |
