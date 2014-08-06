test:
	@node ./bin/_lab -f -m 800
test-cov:
	@node ./bin/_lab -f -t 100 -m 800
test-cov-html:
	@node ./bin/_lab -f -r html -m 800 -o coverage.html

.PHONY: test test-cov test-cov-html
