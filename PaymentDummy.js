import React, { Component, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, Dimensions, TextInput, FlatList, SafeAreaView } from 'react-native';
import {
    initiateCardPayment,
    initiateSamsungPay,
    initiateApplePay,
} from '@network-international/react-native-ngenius';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const appToken = "Basic MDA0ZGNiMTItMmM5Ny00ZmZhLThlYjctYjJjM2FiMWRiNjNlOmRhNzgxNmVlLWFiZjEtNGY0Yi04OTAzLTIzOTdkOWE5ZWM3MA=="
const accessTokenUrl = "https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token"
const orderUrl = "https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/6f4c7c5f-fba1-40d1-9c8d-fb0dec8d8c9f/orders"
export default function PaymentMethod() {
    var flatListref = useRef()
    const [accessToken, setAccessToken] = useState(0)

    const [payment, setPayment] = useState(0)

    const [order, setOrder] = useState(0)
    const [logs, setlogs] = useState([])
    // order is the order response received from NGenius create order API
    const makeCardPayment = async (order) => {
        try {

            logs.push("Making card payment...")
            const resp = await initiateCardPayment(order);

            Alert.alert("Payment response", resp.status)
            console.log(resp.status)

            logs.push("Card payment " + resp.status)

            setlogs(logs)
        } catch (err) {

            logs.push("Payment error " + err.status)

            setlogs(logs)
            Alert.alert("Payment error", err.status)
            console.log({ err });
        }
    };


    const getAccessToken = () => {
        logs.push("Getting access token...")

        setlogs(logs)
        fetch(accessTokenUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/vnd.ni-identity.v1+json',
                    Authorization: appToken
                }
            })
            .then(res => res.json())
            .then(obj => {
                setAccessToken(obj.access_token)
                logs.push("Access token possessed...")

                setlogs(logs)
                getOrder(obj.access_token)
            })
            .catch((error) => {
                console.log(error)
            })

    }
    const getOrder = (token) => {

        logs.push("Getting order...")

        setlogs(logs)
        return fetch(orderUrl,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/vnd.ni-payment.v2+json',
                    'Content-Type': 'application/vnd.ni-payment.v2+json',
                    'Authorization': "Bearer " + token
                },
                body: JSON.stringify({
                    "action": "SALE",
                    "amount": { "currencyCode": "AED", "value": payment }
                })
            })
            .then(res => res.json())
            .then(obj => {
                if (obj.amount) {
                    setOrder(obj)
                    logs.push("Order accessed...")
                    setlogs(logs)
                    makeCardPayment(obj)
                }
                else {
                    Alert("Order error", "Something went wrong")

                    logs.push("Order error...")
                    logs.push(obj)

                    setlogs(logs)
                }
            })
            .catch((error) => {
                console.log(error)
            })

    }

    return (
        <View style={{
            justifyContent: 'center',
            flex: 1, alignItems: 'center', marginHorizontal: '10%'
        }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: '5%' }}>Card Payment</Text>
            <TextInput
                style={{ height: 50, width: '80%', paddingHorizontal: 10, backgroundColor: '#f2f2f2', borderRadius: 7 }}
                onChangeText={setPayment}
                placeholder="Payment amount" />
            <TouchableOpacity
                style={{
                    marginTop: '5%',
                    backgroundColor: "#841584",
                    borderRadius: 7,
                    justifyContent: 'center', alignItems: 'center',
                    width: '50%', height: 40
                }}
                onPress={() => {
                    if (payment)

                        getAccessToken()
                    else Alert.alert(null, "Enter amount.")
                }}
            >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>Place order</Text>
            </TouchableOpacity>

            <FlatList
                onContentSizeChange={() => flatListref.current.scrollToEnd()}
                ref={flatListref}

                inverted
                data={logs}
                contentContainerStyle={{ width: width * 0.90 }}
                style={{
                    position: 'absolute',
                    paddingHorizontal: 4,
                    bottom: 0, height: height * 0.1,
                    borderRadius: 4,
                    //   borderTopColor: 'gray', borderTopWidth: 1
                }}
                renderItem={(item) => {
                    return (<View>
                        <Text style={{ color: 'gray', fontSize: 13 }}>{item.item}</Text>
                    </View>)
                }}
            />


        </View>
    )
}