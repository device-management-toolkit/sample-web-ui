cy:
	@read -r -p "Isolate the front end? (y/n): " isolate;\
	read -r -p "Enter the target url: " targetUrl;\
	npm run cypress -- --env ISOLATED=$$isolate,BASEURL=$$targetUrl

runner:
	@read -r -p "Isolate the front end? (y/n): " isolate;\
	read -r -p "Enter the target url: " targetUrl;\
	npm run cy-runner -- --env ISOLATED=$$isolate,BASEURL=$$targetUrl

# container:
# 	docker run -d -p 4200:80 vprodemo.azurecr.ui/samplewebui:latest

# test-container:
# 	docker run -d -p 4201:80 vprodemo.azurecr.ui/samplewebui:latest

#npm run start

e2e-runner:
#prep
	npx cypress run --spec "cypress/integration/login/*"
#create
	npx cypress run --spec "cypress/integration/cira/create.*"
	npx cypress run --spec "cypress/integration/profile/create.*"
#test
	npx cypress run --spec "cypress/integration/**/create-error.*,cypress/integration/domain/* "
#delete
	npx cypress run --spec "cypress/integration/profile/delete.*"
	npx cypress run --spec "cypress/integration/cira/delete.*"
