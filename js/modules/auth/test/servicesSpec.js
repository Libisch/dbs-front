'use strict';

describe('auth-services', function() {

	describe('auth', function() {
		var auth, apiClient, $httpBackend, $window, requestHeaders;

		beforeEach(function() {
			module('ngResource');
			module('ui.bootstrap');
			module('ui.router');
			module('apiClient');
			module('auth');
		});

		beforeEach(inject(function(_auth_, _apiClient_, _$httpBackend_, _$window_) { 
			auth 			= _auth_;
			apiClient 		= _apiClient_;
			$httpBackend 	= _$httpBackend_;
			$window			= _$window_;

			$httpBackend.whenPOST(apiClient.urls.auth).
				respond(function(method, url, data, headers) {
					var code, response,
						requestData = JSON.parse(data);
					
					if (requestData.username == 'test-username' && requestData.password == 'test-password') {
						response = {
							token: 'test-token'
						};
						code = 200;
					}
					else {
						response = {};
						code = 400;
					}		

					return [code, response];						
				});

			$httpBackend.whenGET(apiClient.urls.user).
				respond(function(method, url, data, headers) {
					requestHeaders = headers;

					if (headers.Authorization === 'Bearer test-token') {
						return[200, {
							username: 'test-user',
							email: 'test-email'
						}];
					}
					else {
						return[403, {
							error: "You don't have the permission to access the requested resource. It is either read-protected or not readable by the server."
						}];
					}
				});
		}));

		
		it('should signin when credentials correct', function() {
			$httpBackend.expectGET(apiClient.urls.login + '/goodtoken')
				.respond(200, {response: {user: {authentication_token: "test-token"}},
							   meta: {code: 200}});
			$httpBackend.expectGET(apiClient.urls.user);
			auth.login('goodtoken');
			$httpBackend.flush();
			expect($window.localStorage.getItem('bhsclient_token'))
				.toEqual('test-token')
			expect(requestHeaders["Authentication-Token"]).toEqual('test-token')
			expect(auth.is_signedin()).toBe(true);
		});


		it('should not signin when credentials are incorrect', function() {
			$httpBackend.expectGET(apiClient.urls.login + '/badtoken')
				.respond(200, {meta: {code: 400}});
			auth.login('badtoken');
			$httpBackend.flush();
			expect($window.localStorage.getItem('bhsclient_token')).toBe(null);
			expect(requestHeaders.Authorization).toBeUndeifned;
			expect(auth.is_signedin()).toBe(false);
		});
	});
});
