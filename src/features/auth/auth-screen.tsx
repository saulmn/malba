import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginFn } from "@/server/auth";

export function LoginScreen() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			if (identifier && password) {
				// En una app real, la contraseña serí­a verificada
				const result = await loginFn({ data: { identifier, password } });
				if (result?.success) {
					navigate({ to: "/" });
				}
			} else {
				setError("Por favor, ingresa correo y contraseña.");
			}
		} catch (err: any) {
			setError(err.message || "Error al iniciar sesión");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
			<Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Bienvenido al Punto de Venta
					</CardTitle>
					<CardDescription className="text-center">
						Ingresa tus credenciales para acceder a tu sucursal
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleLogin}>
					<CardContent className="space-y-4">
						{error && (
							<div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="identifier">Usuario o Correo</Label>
							<Input
								id="identifier"
								type="text"
								placeholder="usuario o admin@ejemplo.com"
								value={identifier}
								onChange={(e) => setIdentifier(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Contraseña</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Iniciando..." : "Iniciar Sesión"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
