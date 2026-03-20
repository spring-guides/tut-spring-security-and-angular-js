<html>
<head>
<link rel="stylesheet" type="text/css"
  href="../webjars/bootstrap/css/bootstrap.min.css" />
<script type="text/javascript" src="../webjars/jquery/jquery.min.js"></script>
<script type="text/javascript" src="../webjars/popper.js/umd/popper.min.js"></script>
<script type="text/javascript"
  src="../webjars/bootstrap/js/bootstrap.min.js"></script>
</head>
<body>
	<div class="container">
		<h2>Please Confirm</h2>

		<p>
			<strong>${principalName}</strong>, do you authorize "<strong>${clientId}</strong>" to access your protected resources
			with scope <strong><#list scopes as scope>${scope}<#if scope_has_next>, </#if></#list></strong>?
		</p>
		<form id="confirmationForm" name="confirmationForm"
			action="/oauth2/authorize" method="post">
			<input type="hidden" name="client_id" value="${clientId}"/>
			<input type="hidden" name="state" value="${state}"/>
			<#list scopes as scope>
			<input type="hidden" name="scope" value="${scope}"/>
			</#list>
			<input type="hidden" id="csrf_token" name="${_csrf.parameterName}" value="${_csrf.token}"/>
			<button class="btn btn-primary" type="submit">Approve</button>
		</form>
		<form id="denyForm" name="denyForm"
			action="/oauth2/authorize" method="post">
			<input type="hidden" name="client_id" value="${clientId}"/>
			<input type="hidden" name="state" value="${state}"/>
			<input type="hidden" id="csrf_token" name="${_csrf.parameterName}" value="${_csrf.token}"/>
			<button class="btn btn-secondary" type="submit">Deny</button>
		</form>
	</div>
</body>
</html>
