cwd := $(CURDIR)

define path-join
	$(shell node -e "console.log(path.join($1,$2))")
endef
define path
	$(call path-join, '${cwd}', $1)
endef

docData := $(call path, '../docs/data')
thisData := $(call path, './data')
tsconfig := $(call path, './src/tsconfig.json')

build: css linkData
	npx tsc -b -v ${tsconfig}
css:
	npx sass src/css/index.scss:assets/css/index.css --style compressed

cssWatch:
	npx sass src/css/index.scss:assets/css/index.css --watch

linkData:
#	@if [ -d ${docData} ]; then \
#		ln -sf ${docData} ${thisData}; \
#	fi

buildWatch: cssWatch linkData
	npx tsc -b -w ${tsconfig}

clean:
	rm -rf $(call path, './assets')

