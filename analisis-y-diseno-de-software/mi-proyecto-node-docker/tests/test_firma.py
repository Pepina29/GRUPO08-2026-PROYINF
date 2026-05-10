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

    # Endpoint: POST /api/auth-code/verify
    def test_01_verificar_pin_valido(self):
        url = f"{self.base_url}/verify"
        payload = {
            "rut": self.rut_prueba,
            "code": "123456"
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        data = response.json()
        
        self.assertEqual(response.status_code, 200, "Debe retornar 200 OK")
        self.assertTrue(data.get("ok"), "El status 'ok' debe ser true")

    def test_02_verificar_pin_invalido_letras(self):
        url = f"{self.base_url}/verify"
        payload = {
            "rut": self.rut_prueba,
            "code": "1234AB"
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        data = response.json()
        
        self.assertEqual(response.status_code, 400, "Debe retornar 400 Bad Request")
        self.assertFalse(data.get("valid"), "El status 'valid' debe ser false")
        self.assertEqual(data.get("message"), "El código debe tener exactamente 6 dígitos")

if __name__ == '__main__':
    unittest.main(verbosity=2)