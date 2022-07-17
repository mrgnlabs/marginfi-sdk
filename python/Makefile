test:
	poetry run pytest -vv -s

test-unit:
	poetry run pytest -vv -m unit

test-integration:
	poetry run pytest -vv -m integration -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-localnet:
	poetry run pytest -vv -m localnet -s # option to prevent capturing output required, or test validator process will not be cleaned up
    
test-devnet:
	poetry run pytest -vv -m devnet

test-cov:
	poetry run pytest --cov -s

check:
	poetry run mypy src tests
	poetry run flake8
