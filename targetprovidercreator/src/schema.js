import {ProfileModel} from 'profile-model'
export class Schema {
  	static inject() {return [ProfileModel]}
	constructor (profileModel){
		this.heading = "SCIM extension target profile"

		this.profileModel = profileModel.model
	}

	get extensionSchema(){
		return JSON.stringify(this.profileModel, null, 4)
	}

	set extensionSchema(text){
		console.log("tata")
	}

	get extensionSchemaEncoded(){
		return encodeURI(this.extensionSchema)
	}
}