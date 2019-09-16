import {Router} from 'aurelia-router'
import {ProfileModel} from 'profile-model'

export class ImportProfile {

  static inject() {return [Router, ProfileModel]}



  constructor(router, profileModel){
    this.heading = 'Please upload an adapter profile!';
    this.profile=""
    this.router = router
    this.profileModel = profileModel
    this.allowChangePassword=true
    this.attributeCaseSensitive = false
    this.displayError = 'none'
    this.displaySuccess = 'none'
    this.error = ""
  }

  created(){
    this.profile=""
    this.fileLoaded = false
    console.log('created called')
  }

  bind(){
    console.log('bind called')
  }

  attached(){
    console.log('attached called')
  }


  get profile(){
    return this._profile
  }

  set profile(files){
    //unzip and process content
    if (!!files) {
     console.log (`profile ${this._profile} set to ${files[0]}`)
     this._profile = files[0]
     this.fileLoaded = true
    }
  }
  save(){
    this.displayError = 'none'
    this.profileModel.parse(this._profile, {
      allowChangePassword: this.allowChangePassword,
      attributeCaseSensitive: this.attributeCaseSensitive
    },err=>{
      if (err){
        console.log('caught err:')
        console.dir(err)
        this.displayError = 'block'
        this.error = err
      }else{
        this.displaySuccess = 'block'
        setTimeout(()=>this.router.navigate('schema'), 2000)
      }
    })      
  }
}

export class UpperValueConverter {
  toView(value) {
    return value && value.toUpperCase();
  }
}