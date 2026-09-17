.PHONY: all libuv libuv_dl hwloc hwloc_dl openssl openssl_dl xmrig xmrig_dl xmrig-mo xmrig-mo_dl install clean

all: libuv hwloc openssl xmrig xmrig-mo install

libuv: libuv_dl
	script/libuv-build.sh

libuv_dl:
	script/libuv-fetch.sh

hwloc: hwloc_dl
	script/hwloc-build.sh

hwloc_dl:
	script/hwloc-fetch.sh

openssl: openssl_dl
	script/openssl-build.sh

openssl_dl:
	script/openssl-fetch.sh

xmrig: xmrig_dl libuv hwloc openssl
	script/xmrig-build.sh

xmrig_dl:
	script/xmrig-fetch.sh

xmrig-mo: xmrig-mo_dl libuv hwloc openssl
	script/xmrig-mo-build.sh

xmrig-mo_dl:
	script/xmrig-mo-fetch.sh

install: xmrig xmrig-mo
	script/install.sh

clean:
	script/clean.sh
