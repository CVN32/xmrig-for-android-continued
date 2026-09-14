# XMRig Android Continued — 최소 검증 체크리스트

기준: `BUILD.md` + 릴리즈 APK 산출물. 검증시각: 2026-09-14 (KST+1d context: 2026-09-15 03:57 KST)

## A) 툴체인 (BUILD.md)

| 항목 | BUILD.md | 박스 상태 | 판정 |
|------|----------|-----------|------|
| Node | v17.1.0 | v20.19.2 | OK (상위) |
| yarn | (RN) | PATH에 없음* | NOTE |
| JDK | (RN/Studio) | OpenJDK 21.0.12.1 | OK |
| CMake | 필요 | 있음 | OK |
| Make | lib-builder | 4.4.1 | OK |
| SDK 29 | Android 10 SDK 29 | platforms/android-29 | OK |
| build-tools 29.0.2 | 필요 | 있음 | OK |
| NDK 23.0.7599858 | 명시 | 설치됨 | OK |
| NDK 21.4 (실제 네이티브 빌드) | — | 21.4.7075529 사용 기록 | NOTE (`LIBBUILDER_BUILD_NOTES.md`) |

\* APK는 이미 빌드됨. 재현 시 yarn 재설치 필요할 수 있음.

## B) 네이티브 (lib-builder → APK)

| 항목 | 기대 | 실측 | 판정 |
|------|------|------|------|
| APK 경로 | release 산출 | `dist/xmrig-continued-0.2.0-arm64.apk` (~51.2 MB) | OK |
| sha256 | 인턴 보고 | `5c086fa39bc56c542df3c119da7f0e772188c0f21919f5eeee91c2a6bb281193` | OK 일치 |
| package | com.xmrigforandroid | 동일 | OK |
| versionName / Code | 0.2.0 / 2000 | 동일 (aapt) | OK |
| label | Continued | `XMRig Continued` | OK |
| ABI × libxmrig.so | 4 ABI, 6.26.0 | arm64/armeabi-v7a/x86/x86_64 전부 `XMRig 6.26.0` | OK |
| ABI × libxmrig-mo.so | 4 ABI, 6.16.5-mo1 동결 | 전부 `XMRig 6.16.5-mo1` | OK |
| 워크트리 jniLibs | 4 ABI | 현재 arm64-v8a만 잔존 | NOTE (APK 내부는 4 ABI) |

## C) 미검증 (범위 밖 / 백로그)

- 실기기 UI opaque 육안 (투명 이슈)
- 실채굴/해시레이트 · SoC 고클럭 프리셋 벤치
- GitHub Releases 업로드 여부
- `yarn` PATH 복구 후 클린 재빌드

## 한 줄 판정

**최소검증 PASS** — APK sha256·버전·4 ABI 네이티브(6.26.0 / mo 6.16.5-mo1) 확인. yarn PATH·워크트리 jniLibs 잔존은 NOTE.
