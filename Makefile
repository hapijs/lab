test:
	@node ./bin/_lab -f -m 1000 -L eslint
test-cov:
	@node ./bin/_lab -f -t 100 -m 1000 -L eslint
test-cov-html:
	@node ./bin/_lab -f -r html -m 1000 -L eslint -o coverage.html

.PHONY: test test-cov test-cov-html
