import React, { Component, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, Dimensions, TextInput, FlatList, SafeAreaView } from 'react-native';
import {
    initiateCardPayment,
    initiateSamsungPay,
    initiateApplePay,
} from '@network-international/react-native-ngenius';
import AsyncStorage from '@react-native-community/async-storage';

//MARK:- Globals
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const OutletId = "6f4c7c5f-fba1-40d1-9c8d-fb0dec8d8c9f"
const appToken = "Basic MDA0ZGNiMTItMmM5Ny00ZmZhLThlYjctYjJjM2FiMWRiNjNlOmRhNzgxNmVlLWFiZjEtNGY0Yi04OTAzLTIzOTdkOWE5ZWM3MA=="

const accessTokenUrl = "https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token"
const orderUrl = "https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/" + OutletId + "/orders"
const AuthPayment = "https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/" + OutletId + "/orders/86b28264-8ae7-4364-937f-99d78b723ea3/payments/d7868d19-aae5-4dcb-9d3c-9b93365d40d4/captures"

//MARK:- Main
export default function PaymentMethod() {

    //MARK:- Variables
    var flatListref = useRef()
    const [accessToken, setAccessToken] = useState(0)

    const [payment, setPayment] = useState(0)
    const [deductionAmount] = useState(1)

    const [order, setOrder] = useState(0)
    const [logs, setlogs] = useState([])

    // order is the order response received from NGenius create order API
    const makeCardPayment = async (order) => {
        try {
            logs.push("Making card payment...")
            const resp = await initiateCardPayment(order);

            Alert.alert("Payment response", resp.status)

            logs.push("Card payment " + resp.status)
            setlogs(logs)

            deductPayment()

        } catch (err) {

            logs.push("Payment error " + err.status)
            setlogs(logs)
            Alert.alert("Payment error", err.status)
        }
    };
    const deductPayment = () => {
        AsyncStorage.getItem('Resources').then(info => {
            logs.push("Deducting " + deductionAmount + "AED from total ...")
            setlogs(logs)

            const c = info ? JSON.parse(info) : [];

            const AuthPaymentUrl = orderUrl + "/" + c.orderId + "/payments/" + c.paymentId + "/captures"

            fetch(AuthPaymentUrl,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/vnd.ni-payment.v2+json',
                        'Content-Type': 'application/vnd.ni-payment.v2+json',
                        'Authorization': "Bearer " + accessToken
                    },
                    body: JSON.stringify({
                        "action": "AUTH",
                        "amount": { "currencyCode": "AED", "value": deductionAmount }
                    })
                })
                .then(res => res.json())
                .then(obj => {
                    if (obj.amount) {
                        logs.push(deductionAmount + "AED deducted from " + obj.amount.value + "...")
                        setlogs(logs)

                    }
                    else {
                        Alert("Deduction error", "Something went wrong")

                        logs.push("Order error...")
                        logs.push(obj)

                        setlogs(logs)
                    }
                })
                .catch((error) => {
                    console.log(error)
                })

        });
    }

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
                    "action": "AUTH",
                    "amount": { "currencyCode": "AED", "value": payment }
                })
            })
            .then(res => res.json())
            .then(obj => {
                console.log(JSON.stringify(obj))
                if (obj.amount) {
                    const embeded = obj._embedded.payment[0]
                    const paymentId = embeded._id.split(':')[2]

                    const resource = { "orderId": obj.reference, "paymentId": paymentId }
                    AsyncStorage.setItem("Resources", JSON.stringify(resource))
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
            <Text style={{ fontSize: 7, color: 'gray', marginTop: 5, }}>v1.0.1(2)</Text>
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