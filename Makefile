dev:
	npm run dev

install:
	npm install
	cd frontend && npm install
	cd backend && pip install -r requirements.txt

build:
	cd frontend && npm run build

clean:
	rm -rf .next
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf __pycache__
	find . -name "*.pyc" -delete
