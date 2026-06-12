document.getElementById("loginForm").onsubmit = async function(e){

e.preventDefault()

let formData = new FormData(this)

let res = await fetch("/login",{
method:"POST",
body:formData
})

let data = await res.json()

alert(data.message)

}