test:
	@node ./bin/testlab
	@node ./bin/lab
test-cov:
	@node ./bin/testlab
	@node ./bin/lab -t 100
test-cov-html:
	@node ./bin/testlab
	@node ./bin/lab -r html -o coverage.html

.PHONY: test test-cov test-cov-html
