test:
	@node ./bin/_lab
test-cov:
	@node ./bin/_lab -t 85
test-cov-html:
	@node ./bin/_lab -r html -o coverage.html

.PHONY: test test-cov test-cov-html
