import unittest
import requests

class TestAuthCodeAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.base_url = "http://localhost:3000/api/auth-code"
        cls.headers = {'Content-Type': 'application/json'}
        cls.rut_prueba = "21550326-7" 
        print("\n-- Iniciando pruebas unitarias de firma digital --")

    @classmethod
    def tearDownClass(cls):
        print("--- Pruebas finalizadas ---")

    def test_01_verificar_pin_valido(self):
        url = f"{self.base_url}/verify"        
        payload_exitoso = {
            "rut": self.rut_prueba,
            "code": "123456"
        }
        
        response_exitoso = requests.post(url, json=payload_exitoso, headers=self.headers)
        data_exitoso = response_exitoso.json()
        
        self.assertEqual(response_exitoso.status_code, 200, "Debe retornar 200 OK")
        self.assertTrue(data_exitoso.get("ok"), "El status 'ok' debe ser true")
        payload_falso = {
            "rut": "99999999-9", # RUT que no existe
            "code": "123456"
        }
        
        response_falso = requests.post(url, json=payload_falso, headers=self.headers)
        data_falso = response_falso.json()        
        self.assertNotEqual(response_falso.status_code, 200, "No debe retornar 200 si el RUT no está en la BD")
        self.assertFalse(data_falso.get("ok", True), "El status 'ok' debe ser false o no existir si el RUT es inválido")

    def test_02_verificar_pin_invalido_letras(self):
        url = f"{self.base_url}/verify"
        payload = {
            "rut": self.rut_prueba,
            "code": "1234AB"
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        data = response.json()
        
        self.assertEqual(response.status_code, 400, "Debe retornar 400 Bad Request")
        self.assertFalse(data.get("ok", True), "El status 'ok' debe ser false")
        self.assertEqual(data.get("message"), "El código debe tener exactamente 6 dígitos")

if __name__ == '__main__':
    unittest.main(verbosity=2)