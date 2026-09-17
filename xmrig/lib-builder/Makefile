.PHONY: all prepare toolchain libuv libuv_dl hwloc hwloc_dl openssl openssl_dl xmrig xmrig_dl xmrig-mo xmrig-mo_dl install clean

all: prepare toolchain libuv hwloc openssl xmrig xmrig-mo install

prepare:
	mkdir -p build/src build/build

toolchain: prepare
	script/toolchain-build.sh

libuv: libuv_dl toolchain
	script/libuv-build.sh

libuv_dl: prepare
	script/libuv-fetch.sh

hwloc: hwloc_dl toolchain
	script/hwloc-build.sh

hwloc_dl: prepare
	script/hwloc-fetch.sh

openssl: openssl_dl toolchain
	script/openssl-build.sh

openssl_dl: prepare
	script/openssl-fetch.sh

xmrig: xmrig_dl libuv hwloc openssl
	script/xmrig-build.sh

xmrig_dl: prepare
	script/xmrig-fetch.sh

xmrig-mo: xmrig-mo_dl libuv hwloc openssl
	script/xmrig-mo-build.sh

xmrig-mo_dl: prepare
	script/xmrig-mo-fetch.sh

install: xmrig xmrig-mo
	script/install.sh

clean:
	script/clean.sh
