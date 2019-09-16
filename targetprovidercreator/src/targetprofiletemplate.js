export class TargetProfileTemplate{
      static getTemplate() {
            return{
	"name": "",
      "description": " target profile definition",
      "providerType": "",
      "providerConfig": {
            "changePassword": true
      },
	"resourceTypes": [],
      "userExtension": {
            "schema": "",
            "definition": {
                  "id": "",
                  "name": "CustomUserExtension",
                  "description": "Security adapter view of a user",
                  "attributes": []
            },
            "attributeMapping": {
                  "objectProfile": "",
                  "resourceType": "User",
                  "commonAttributes": {
                        "externalId": "",
                        "meta": {
                              "created": "",
                              "lastModified": ""
                        }
                  },
                  "coreAttributes": {
                        "userName": "eruid",
                        "password": "erpassword",
                        "active": "eraccountstatus",
                        "name": {
                              "formatted": "",
                              "familyName": "",
                              "givenName": "",
                              "middleName": "",
                              "honorificPrefix": "",
                              "honorificSuffix": ""
                        },
                        "displayName": "",
                        "nickName": "",
                        "profileUrl": "",
                        "title": "",
                        "userType": "",
                        "preferredLanguage": "",
                        "locale": "",
                        "timezone": "",
                        "emails": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "phoneNumbers": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "ims": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "photos": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "addresses": [
                              {
                                    "formatted": [],
                                    "streetAddress": [],
                                    "locality": "",
                                    "region": "",
                                    "postalCode": "",
                                    "country": "",
                                    "type": ""
                              }
                        ],
                        "groups": [
                              {
                                    "value": "",
                                    "display": "",
                                    "type": ""
                              }
                        ],
                        "entitlements": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "roles": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ],
                        "x509Certificates": [
                              {
                                    "value": "",
                                    "display": "",
                                    "primary": "",
                                    "type": ""
                              }
                        ]
                  },
                  "enterpriseExtensionAttributes": {
                        "employeeNumber": "",
                        "costCenter": "",
                        "organization": "",
                        "division": "",
                        "department": "",
                        "manager": {
                              "value": "",
                              "displayname": ""
                        }
                  }
            }
      },
      "groupExtensions": [],
      "targetSchema": {
            "schema": "",
            "definition": {
		"name": "Target definition"
	     }
      },
      "otherSchemas": []
}}
      
}