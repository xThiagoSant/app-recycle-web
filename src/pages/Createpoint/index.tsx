import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import axios from 'axios'
import { LeafletMouseEvent } from 'leaflet'


import './styles.css'
import logo from '../../assets/logo.svg'
import api from '../../services/api'

//Array ou objeto: manualmente informar o tipo de variável

interface Item {
    id: number
    title: string
    image_url: string
}

interface IBGEUFResponse{
    sigla: string
}

interface IBGECityResponse{ 
    nome:string
}

const CreatePoint = () => {
    //estado criação
    const [items, setItems] = useState<Item[]>([])
    const [Ufs, setUfs] = useState<string[]>([])
    const [Cities, setCities] = useState<string[]>([])
    const [initialPos, setInitialPos] = useState<[number, number]>([0,0])

    //estados de selecoes
    const [selectedUf, setSelectedUf] = useState('0')
    const [selectedCity, setSelectedCity] = useState('0')
    const [selectedPos, setSelectedPos] = useState<[number, number]>([0,0])
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    })
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const history = useHistory()

    //Qual função, quando: se esse array ficar vazio a função vai ser executada só uma vez
    useEffect(() => {
        api.get('items').then(response =>{
           setItems(response.data)
        })
    }, [])

    useEffect(() =>{
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response =>{
            const ufInitials = response.data.map(uf => uf.sigla)
            setUfs(ufInitials)
        })
    }, [])

    //carregar as cidades quando mudar de UF
    useEffect(()=>{
        if( selectedUf === '0'){
            return
        }        

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome)
            setCities(cityNames)
        })        
    }, [selectedUf])

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(positions => {
            const { latitude, longitude } = positions.coords;
            setInitialPos([latitude, longitude])
        })        
    }, [])

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value
        setSelectedUf(uf)
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value
        setSelectedCity(city)
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPos([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value} = event.target
        setFormData({...formData, [name]: value})
    }

    function handleSelectItem(id: number){
        const alreadSelected = selectedItems.findIndex(item => item === id)
        //se for diferente de -1, então não foi selecionado
        if(alreadSelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id)
            setSelectedItems(filteredItems)
        }
        else{
            setSelectedItems([...selectedItems, id])
        }        
    }

    async function handleSubimit(event: FormEvent){
        event.preventDefault()
        const { name, email, whatsapp } = formData
        const uf = selectedUf
        const city = selectedCity
        const [latitude, longitude] = selectedPos
        const items = selectedItems

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data)
        alert('Ponto de coleta criado')
        history.push('/')
    }


   return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to='/'>
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>

            <form onSubmit={handleSubimit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend> 

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}                        
                        />                        
                    </div>

                    <div className="field-group">
                         <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email"
                                name='email'
                                id='email'                        
                                onChange={handleInputChange}
                            />                        
                         </div>                            

                         <div className="field">
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input 
                                type="text"
                                name='whatsapp'
                                id='whatsapp'
                                onChange={handleInputChange}
                            />                        
                         </div>                                                     
                    </div>   
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend> 

                    <Map center={initialPos} zoom={15} onclick={handleMapClick} >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />  

                        <Marker position={selectedPos} />                      
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                                <option value="0">Selecione uma UF</option>
                                {Ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>                             
                        <div className="field">
                            <label htmlFor="city">Estado (UF)</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity} >
                                <option value="0">Selecione uma Cidade</option>
                                {Cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>                         
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecioneum ou mais itens abaixo</span>
                    </legend> 

                    <ul className='items-grid'>
                        {items.map(item => (
                            <li key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}>
                            <img src={item.image_url} alt={item.title} />
                            <span>{item.title}</span>
                        </li>                    
                        ) )}
                    </ul>   
                </fieldset>  

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
   ) 
}

export default CreatePoint